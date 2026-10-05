import createFetchClient, { type Client, type Middleware } from "openapi-fetch";

import { createClientCredentialsTokenProvider, type ClientCredentialsConfig } from "./auth";
import type { paths } from "./generated/context-engine";

export type HttpClientOptions = {
  baseUrl: string;
  /**
   * Custom fetch implementation. Defaults to `globalThis.fetch`.
   * Works in Node 20+ and all modern browsers out of the box.
   * Useful for injecting a mock or a custom fetch in tests.
   */
  fetch?: typeof globalThis.fetch;
  /**
   * How to authenticate against a secured Context Engine server. Accepts either
   * shape:
   *
   * - A {@link ClientCredentialsConfig} — the common case. Pass just your OAuth2
   *   client credentials and the client sets up token acquisition, caching, and
   *   refresh for you.
   * - A token function `() => string | Promise<string>` — the escape hatch for
   *   full control (a token from elsewhere, a different grant, or a custom
   *   refresh strategy). Called per request, so a provider can cache and refresh
   *   internally (e.g. {@link createClientCredentialsTokenProvider}); a falsy
   *   return value leaves the header unset.
   *
   * Either way the resolved token is attached as `Authorization: Bearer <token>`
   * on every request. Omit for an unsecured server.
   */
  auth?: ClientCredentialsConfig | (() => string | Promise<string>);
};

export class HttpClient {
  readonly #client: Client<paths>;

  constructor(options: HttpClientOptions) {
    this.#client = createFetchClient<paths>({
      baseUrl: options.baseUrl,
      fetch: options.fetch,
    });

    // A token function is used as-is; a config object builds a client-credentials
    // provider. The custom `fetch` is threaded into the token exchange too so
    // tests/proxies apply to both hops.
    const getAccessToken =
      typeof options.auth === "function"
        ? options.auth
        : options.auth
          ? createClientCredentialsTokenProvider({ fetch: options.fetch, ...options.auth })
          : undefined;

    if (getAccessToken) {
      const authMiddleware: Middleware = {
        async onRequest({ request }) {
          const token = await getAccessToken();
          if (token) request.headers.set("Authorization", `Bearer ${token}`);
          return request;
        },
      };
      this.#client.use(authMiddleware);
    }
  }

  get GET(): Client<paths>["GET"] {
    return this.#client.GET;
  }

  get POST(): Client<paths>["POST"] {
    return this.#client.POST;
  }

  get PUT(): Client<paths>["PUT"] {
    return this.#client.PUT;
  }

  get PATCH(): Client<paths>["PATCH"] {
    return this.#client.PATCH;
  }

  get DELETE(): Client<paths>["DELETE"] {
    return this.#client.DELETE;
  }

  use(...middleware: Middleware[]): this {
    this.#client.use(...middleware);
    return this;
  }

  eject(...middleware: Middleware[]): this {
    this.#client.eject(...middleware);
    return this;
  }
}
