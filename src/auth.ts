import * as oauth from "oauth4webapi";

/**
 * OAuth2 client-credentials helpers for authenticating against a secured
 * Context Engine workspace.
 *
 * The server validates a bearer JWT in the `Authorization` header against a
 * JWKS. This module provides the client half: a token provider that exchanges
 * a `client_id`/`client_secret` for an access token, caches it, and refreshes
 * it before expiry. The token exchange itself is delegated to `oauth4webapi`
 * (standards-compliant request building + response validation); this module
 * only adds caching, concurrent-request de-duplication, and a small config
 * surface. Pass the raw config as {@link HttpClientOptions.auth}, or — for full
 * control — pass the returned provider as the {@link HttpClientOptions.auth}
 * token function.
 */

/**
 * Resolves to a currently-valid bearer access token. Called per request; a
 * well-behaved provider caches internally and only hits the network when the
 * cached token is missing or about to expire.
 */
export type TokenProvider = () => Promise<string>;

/**
 * Clinia's authorization server, applied when a config names neither a
 * `tokenUrl` nor an `issuer` — so `{ clientId, clientSecret }` is a complete
 * config for a Clinia workspace, which is the overwhelmingly common case.
 *
 * `RESOURCE` is only defaulted alongside `TOKEN_URL`: it is an RFC 8707
 * indicator naming Clinia's protected resource, and sending it to somebody
 * else's authorization server would be wrong.
 */
const CLINIA_OAUTH_TOKEN_URL = "https://console.clinia.cloud/api/auth/oauth2/token";
const CLINIA_OAUTH_RESOURCE = "https://console.clinia.cloud";

/** Fields common to both ways of locating the authorization server. */
type ClientCredentialsBase = {
  clientId: string;
  clientSecret: string;
  /**
   * Optional `resource` indicator (RFC 8707) naming the protected resource the
   * token is for. This is what the Clinia authorization server expects (e.g.
   * `https://console.clinia.cloud`).
   */
  resource?: string;
  /** Optional `audience` parameter (used by some IdPs, e.g. Auth0). */
  audience?: string;
  /** Optional space-delimited `scope`. */
  scope?: string;
  /**
   * How the client credentials are presented to the token endpoint. `post`
   * (the default) sends them in the request body — what the Clinia
   * authorization server expects; `basic` sends them in the `Authorization`
   * header (RFC 6749 §2.3.1) for IdPs that require it.
   */
  authMethod?: "basic" | "post";
  /**
   * Custom fetch implementation. Defaults to `globalThis.fetch`. Useful for
   * injecting a mock in tests.
   */
  fetch?: typeof globalThis.fetch;
  /**
   * Refresh the token this many milliseconds before it actually expires, to
   * avoid handing out a token that expires mid-flight. Defaults to 60_000.
   */
  expiryMarginMs?: number;
};

/**
 * Client-credentials configuration.
 *
 * For a Clinia workspace, `{ clientId, clientSecret }` is enough — the token
 * endpoint and `resource` indicator default to Clinia's authorization server.
 * Naming an {@link issuer} instead locates a different authorization server by
 * OIDC/OAuth2 discovery; naming a {@link tokenUrl} points at one explicitly.
 */
export type ClientCredentialsConfig =
  | (ClientCredentialsBase & {
      /**
       * Issuer identifier of the authorization server. Its metadata (token
       * endpoint, etc.) is resolved via discovery on first use.
       */
      issuer: string;
      /** Discovery transformation: `oidc` (default) or `oauth2` (RFC 8414). */
      discoveryAlgorithm?: "oidc" | "oauth2";
      tokenUrl?: never;
    })
  | (ClientCredentialsBase & {
      /**
       * Explicit OAuth2 token endpoint; discovery is skipped. Omit it — along
       * with `issuer` — to use Clinia's.
       */
      tokenUrl?: string;
      /** Issuer identifier for response validation; defaults to the token URL's origin. */
      issuer?: string;
      discoveryAlgorithm?: never;
    });

const DEFAULT_EXPIRY_MARGIN_MS = 60_000;
/** Fallback lifetime when the token endpoint omits `expires_in`. */
const DEFAULT_TTL_MS = 5 * 60_000;

/** Turns an `oauth4webapi` failure into a concise, stable error message. */
function describeOAuthError(err: unknown): string {
  if (err instanceof oauth.ResponseBodyError) {
    return `${err.status} ${err.error}${err.error_description ? ` — ${err.error_description}` : ""}`;
  }
  if (err instanceof oauth.WWWAuthenticateChallengeError) {
    return `${err.status} ${err.message}`;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Builds a {@link TokenProvider} backed by the OAuth2 client-credentials grant.
 *
 * The provider caches the access token and reuses it until it is within
 * `expiryMarginMs` of expiry. Concurrent calls while a fetch is in flight share
 * the same request rather than each hitting the token endpoint. When configured
 * with an {@link ClientCredentialsConfig.issuer}, the authorization server
 * metadata is discovered once and memoized.
 */
export function createClientCredentialsTokenProvider(
  config: ClientCredentialsConfig,
): TokenProvider {
  const expiryMarginMs = config.expiryMarginMs ?? DEFAULT_EXPIRY_MARGIN_MS;

  // Defaulted only when the token endpoint is also defaulted. `resource` names
  // Clinia's protected resource, so attaching it to a request aimed at somebody
  // else's authorization server would be both wrong and a small disclosure.
  const usesCliniaAuthServer = !config.tokenUrl && !config.issuer;
  const resource = config.resource ?? (usesCliniaAuthServer ? CLINIA_OAUTH_RESOURCE : undefined);

  const client: oauth.Client = { client_id: config.clientId };
  const clientAuth =
    config.authMethod === "basic"
      ? oauth.ClientSecretBasic(config.clientSecret)
      : oauth.ClientSecretPost(config.clientSecret);

  // Shared HTTP options (custom fetch + insecure opt-in) applied to every
  // oauth4webapi call. The `as never` bridges the customFetch signature, which
  // is generic over method/body per call site but is the same fn at runtime.
  // oauth4webapi rejects non-TLS endpoints by default; we relax that per call
  // when — and only when — the target URL is itself `http://` (local dev),
  // rather than exposing a separate flag.
  const fetchImpl = config.fetch;
  const isInsecure = (url: string | undefined): boolean =>
    !!url && new URL(url).protocol === "http:";
  function withHttpOptions<T extends object>(opts: T, insecure: boolean): T {
    const o = opts as T & {
      [oauth.customFetch]?: unknown;
      [oauth.allowInsecureRequests]?: boolean;
    };
    if (fetchImpl) {
      o[oauth.customFetch] = ((url: string, options: RequestInit) =>
        fetchImpl(url, options)) as never;
    }
    if (insecure) o[oauth.allowInsecureRequests] = true;
    return o;
  }

  // Authorization server metadata, resolved once. For an explicit tokenUrl it's
  // synchronous; for an issuer it requires a discovery request, so it's async
  // and memoized (with retry on failure — a rejected attempt isn't cached).
  let resolvedAs: oauth.AuthorizationServer | null = null;
  let asInFlight: Promise<oauth.AuthorizationServer> | null = null;

  async function resolveAuthServer(): Promise<oauth.AuthorizationServer> {
    // Discovery only when an issuer is named and no explicit endpoint overrides
    // it. There is no "neither given" case left to handle — that is the Clinia
    // default, which is why this no longer throws.
    if (!config.issuer || config.tokenUrl) {
      const tokenUrl = config.tokenUrl ?? CLINIA_OAUTH_TOKEN_URL;
      return {
        issuer: config.issuer ?? new URL(tokenUrl).origin,
        token_endpoint: tokenUrl,
      };
    }
    const issuerUrl = new URL(config.issuer);
    const response = await oauth.discoveryRequest(
      issuerUrl,
      withHttpOptions<oauth.DiscoveryRequestOptions>(
        { algorithm: config.discoveryAlgorithm ?? "oidc" },
        isInsecure(config.issuer),
      ),
    );
    return oauth.processDiscoveryResponse(issuerUrl, response);
  }

  function getAuthServer(): Promise<oauth.AuthorizationServer> {
    if (resolvedAs) return Promise.resolve(resolvedAs);
    if (!asInFlight) {
      asInFlight = resolveAuthServer()
        .then((as) => (resolvedAs = as))
        .finally(() => {
          asInFlight = null;
        });
    }
    return asInFlight;
  }

  let cachedToken: string | null = null;
  /** Absolute epoch ms at which the cached token should be considered stale. */
  let expiresAt = 0;
  /** In-flight fetch, shared across concurrent callers to dedupe requests. */
  let inFlight: Promise<string> | null = null;

  async function fetchToken(): Promise<string> {
    const params = new URLSearchParams();
    if (resource) params.set("resource", resource);
    if (config.audience) params.set("audience", config.audience);
    if (config.scope) params.set("scope", config.scope);

    let result: oauth.TokenEndpointResponse;
    try {
      const as = await getAuthServer();
      const response = await oauth.clientCredentialsGrantRequest(
        as,
        client,
        clientAuth,
        params,
        withHttpOptions<oauth.ClientCredentialsGrantRequestOptions>(
          {},
          isInsecure(as.token_endpoint),
        ),
      );
      result = await oauth.processClientCredentialsResponse(as, client, response);
    } catch (err) {
      throw new Error(`client_credentials token request failed: ${describeOAuthError(err)}`, {
        cause: err,
      });
    }

    const ttlMs = result.expires_in ? result.expires_in * 1000 : DEFAULT_TTL_MS;
    cachedToken = result.access_token;
    expiresAt = Date.now() + Math.max(0, ttlMs - expiryMarginMs);
    return cachedToken;
  }

  return async function getAccessToken(): Promise<string> {
    if (cachedToken && Date.now() < expiresAt) return cachedToken;
    if (inFlight) return inFlight;

    inFlight = fetchToken().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };
}
