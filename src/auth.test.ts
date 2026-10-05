import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClientCredentialsTokenProvider } from "./auth";
import { HttpClient } from "./http-client";

/**
 * A fetch mock that records the outgoing requests (normalized through a real
 * `Request`, so header casing / body encoding don't matter) and replies with a
 * token-endpoint JSON body.
 */
function recordingTokenFetch(response: Record<string, unknown>, status = 200) {
  const requests: Request[] = [];
  const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(url as string, init));
    return new Response(JSON.stringify(response), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  return { fetchMock, requests };
}

/** A minimal successful client-credentials token body (oauth4webapi requires `token_type`). */
function tokenBody(overrides: Record<string, unknown> = {}) {
  return { access_token: "tok-1", token_type: "Bearer", expires_in: 3600, ...overrides };
}

describe("createClientCredentialsTokenProvider", () => {
  const baseConfig = {
    tokenUrl: "https://idp.example.com/oauth/token",
    clientId: "client-abc",
    clientSecret: "secret-xyz",
  };

  beforeEach(() => {
    vi.useRealTimers();
  });

  it("defaults to credentials in the body (client_secret_post) with grant + resource", async () => {
    const { fetchMock, requests } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      resource: "https://console.clinia.cloud",
      scope: "read write",
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(await getToken()).toBe("tok-1");
    expect(requests).toHaveLength(1);

    const req = requests[0];
    expect(req.url).toBe(baseConfig.tokenUrl);
    expect(req.method).toBe("POST");
    expect(req.headers.get("content-type")).toContain("application/x-www-form-urlencoded");
    // Default authMethod is "post": credentials go in the body, not a Basic header.
    expect(req.headers.get("authorization")).toBeNull();

    const body = new URLSearchParams(await req.text());
    expect(body.get("grant_type")).toBe("client_credentials");
    expect(body.get("client_id")).toBe("client-abc");
    expect(body.get("client_secret")).toBe("secret-xyz");
    expect(body.get("resource")).toBe("https://console.clinia.cloud");
    expect(body.get("scope")).toBe("read write");
  });

  it("targets Clinia's authorization server when given only credentials", async () => {
    const { fetchMock, requests } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      clientId: "client-abc",
      clientSecret: "secret-xyz",
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(await getToken()).toBe("tok-1");
    expect(requests[0].url).toBe("https://console.clinia.cloud/api/auth/oauth2/token");
    // The RFC 8707 resource indicator is defaulted alongside the endpoint —
    // Clinia's authorization server requires it.
    expect(new URLSearchParams(await requests[0].text()).get("resource")).toBe(
      "https://console.clinia.cloud",
    );
  });

  it("does not send Clinia's resource indicator to a third-party token endpoint", async () => {
    const { fetchMock, requests } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    await getToken();
    expect(requests[0].url).toBe(baseConfig.tokenUrl);
    // Defaulting `resource` here would both break the request and leak a Clinia
    // URL to an unrelated authorization server.
    expect(new URLSearchParams(await requests[0].text()).get("resource")).toBeNull();
  });

  it("sends credentials via Basic auth when authMethod is 'basic'", async () => {
    const { fetchMock, requests } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      authMethod: "basic",
      fetch: fetchMock as unknown as typeof fetch,
    });

    await getToken();
    // oauth4webapi form-encodes the credentials before base64 (RFC 6749 §2.3.1),
    // so decode rather than exact-match a pre-encoded string.
    const auth = requests[0].headers.get("authorization") ?? "";
    expect(auth).toMatch(/^Basic /);
    const [id, secret] = atob(auth.slice("Basic ".length)).split(":").map(decodeURIComponent);
    expect(id).toBe("client-abc");
    expect(secret).toBe("secret-xyz");
  });

  it("allows an http:// token endpoint automatically (oauth4webapi rejects non-TLS by default)", async () => {
    const { fetchMock } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      tokenUrl: "http://localhost:3000/oauth/token",
      fetch: fetchMock as unknown as typeof fetch,
    });

    // Would throw "only requests to HTTPS are allowed" without the inference.
    expect(await getToken()).toBe("tok-1");
  });

  it("caches the token and does not refetch within its TTL", async () => {
    const { fetchMock } = recordingTokenFetch(tokenBody());
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    await getToken();
    await getToken();
    await getToken();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the cached token is within the expiry margin", async () => {
    vi.useFakeTimers();
    // expires_in 100s with the default 60s margin => cache is valid ~40s.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenBody({ access_token: "tok-1", expires_in: 100 })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenBody({ access_token: "tok-2", expires_in: 100 })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(await getToken()).toBe("tok-1");
    vi.advanceTimersByTime(50_000); // past the 40s valid window
    expect(await getToken()).toBe("tok-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent fetches into a single request", async () => {
    // Create the deferred upfront: oauth4webapi awaits internally before it
    // calls fetch, so a `resolve` captured inside the executor wouldn't be set
    // yet when the test resolves it.
    let resolve!: (r: Response) => void;
    const pending = new Promise<Response>((res) => (resolve = res));
    const fetchMock = vi.fn(() => pending);
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const p1 = getToken();
    const p2 = getToken();
    resolve(
      new Response(JSON.stringify(tokenBody()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(await p1).toBe("tok-1");
    expect(await p2).toBe("tok-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("discovers the token endpoint from an issuer and memoizes the metadata", async () => {
    const issuer = "https://idp.example.com";
    const wellKnown = `${issuer}/.well-known/openid-configuration`;
    const tokenEndpoint = `${issuer}/oauth/token`;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url === wellKnown) {
        return new Response(JSON.stringify({ issuer, token_endpoint: tokenEndpoint }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(tokenBody({ access_token: "tok-disc" })), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const getToken = createClientCredentialsTokenProvider({
      issuer,
      clientId: "client-abc",
      clientSecret: "secret-xyz",
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(await getToken()).toBe("tok-disc");
    // Second call reuses the cached token — and would reuse discovered metadata
    // even on a refetch. Discovery must have run exactly once.
    await getToken();
    const discoveryCalls = fetchMock.mock.calls.filter(([input]) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      return url === wellKnown;
    });
    expect(discoveryCalls).toHaveLength(1);
  });

  it("throws a descriptive error on an OAuth error response", async () => {
    const { fetchMock } = recordingTokenFetch({ error: "invalid_client" }, 401);
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(getToken()).rejects.toThrow(/token request failed: 401 invalid_client/);
  });

  it("throws when the response omits access_token", async () => {
    const { fetchMock } = recordingTokenFetch({ token_type: "Bearer" });
    const getToken = createClientCredentialsTokenProvider({
      ...baseConfig,
      fetch: fetchMock as unknown as typeof fetch,
    });

    await expect(getToken()).rejects.toThrow(/token request failed/);
  });
});

describe("HttpClient auth", () => {
  const apiBody = () =>
    new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  it("attaches Authorization: Bearer <token> from an auth token function", async () => {
    const captured: Request[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      captured.push(new Request(input as string, init));
      return apiBody();
    });

    const client = new HttpClient({
      baseUrl: "https://workspace.example.com",
      fetch: fetchMock as unknown as typeof fetch,
      auth: () => "tok-123",
    });
    await client.GET("/v1/patients" as never);

    expect(captured[0].headers.get("Authorization")).toBe("Bearer tok-123");
  });

  it("wires up client-credentials from the high-level `auth` option", async () => {
    const tokenUrl = "https://idp.example.com/oauth/token";
    const apiRequests: Request[] = [];
    // One fetch serving both hops: the token endpoint and the API.
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      if (url === tokenUrl) {
        return new Response(JSON.stringify(tokenBody({ access_token: "tok-oauth" })), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      // openapi-fetch passes a Request (headers live on it); keep it intact
      // rather than reconstructing from the URL, which would drop the header.
      apiRequests.push(input instanceof Request ? input : new Request(url, init));
      return apiBody();
    });

    const client = new HttpClient({
      baseUrl: "https://workspace.example.com",
      fetch: fetchMock as unknown as typeof fetch,
      auth: { tokenUrl, clientId: "client-abc", clientSecret: "secret-xyz" },
    });
    await client.GET("/v1/patients" as never);

    expect(apiRequests[0].headers.get("Authorization")).toBe("Bearer tok-oauth");
  });

  it("sends no Authorization header when neither auth option is set", async () => {
    const captured: Request[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      captured.push(new Request(input as string, init));
      return apiBody();
    });

    const client = new HttpClient({
      baseUrl: "https://workspace.example.com",
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.GET("/v1/patients" as never);

    expect(captured[0].headers.get("Authorization")).toBeNull();
  });
});
