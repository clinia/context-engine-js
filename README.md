# Context Engine TypeScript Client

TypeScript client for the Clinia Context Engine API. A thin, typed wrapper over
[`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) — request/response
shapes are generated from the OpenAPI contract, so paths, params, and bodies are
fully type-checked. Works in Node 20+ and modern browsers on the standard
`fetch`.

## Install

```sh
npm install @clinia/context-engine-js
```

Published on [npm](https://www.npmjs.com/package/@clinia/context-engine-js). No
registry configuration or authentication is needed. Only stable releases are
published here.

**This package is ESM-only** (`"type": "module"`). `require()` of it throws
`ERR_REQUIRE_ESM`; use `import`, or a dynamic `await import()` from CommonJS.

## Exports

| Export                                     | Description                                                                                                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ContextEngineClient`                      | Entry point. One resource property per API area, plus a low-level `http` client.                                                                             |
| Resource classes                           | `InfoResource`, `PatientsResource`, `IngestResource`, `SessionsResource`, `VFSResource`, `GraphResource` — to construct one on its own over an `HttpClient`. |
| `Resources`, `createResources`             | The resource set as an interface, and a builder for one of each over a shared `HttpClient`.                                                                  |
| `HttpClient`                               | Typed `openapi-fetch` wrapper (`GET`/`POST`/`PUT`/`PATCH`/`DELETE`, `use`).                                                                                  |
| `ContextEngineClientOptions`               | Constructor options (alias of `HttpClientOptions`).                                                                                                          |
| `createClientCredentialsTokenProvider`     | Builds a caching OAuth2 client-credentials token provider.                                                                                                   |
| `TokenProvider`, `ClientCredentialsConfig` | Auth types.                                                                                                                                                  |
| `paths`, generated request/response types  | Emitted from the OpenAPI spec.                                                                                                                               |

## Usage

Every Clinia workspace requires authentication. Create OAuth credentials in the
[Console](https://console.clinia.cloud) — scoped to your workspace, with **Read &
Write** if you intend to ingest data or create patients — then point `baseUrl` at
your workspace:

```ts
import { ContextEngineClient } from "@clinia/context-engine-js";

const client = new ContextEngineClient({
  baseUrl: "https://<workspace-id>.w.clinia.cloud",
  auth: {
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
  },
});

const { data, error } = await client.patients.listPatients();
```

That is the whole configuration. The client resolves Clinia's authorization
server, acquires a bearer token, caches it, refreshes it before expiry, and
attaches `Authorization: Bearer <token>` to every request. Tokens last an hour;
you do not manage them.

### Resources

Each area of the API is a property on the client, with one method per operation:

```ts
await client.patients.getPatient("abc");
await client.graph.listNodes("abc", "fact", { query: { perPage: 50 } });
await client.ingest.ingestCdaR2("abc", cdaXml);
await client.ingest.ingestCdaR2Multipart("abc", { documents: [firstCda, secondCda] });
await client.ingest.ingestSessions("abc", {
  sessions: [{ messages: [{ role: "user", content: "Hi" }] }],
});
```

Responses are `{ data, error }` — nothing throws on a non-2xx.

### The `http` client

`client.http` covers anything the resource methods do not. It exposes the typed
verbs directly, with the path, path params, query, and body all checked against
the OpenAPI contract:

```ts
await client.http.GET("/v1/patients/{patientId}/read", {
  params: { path: { patientId: "abc" } },
});
```

### Without authentication

Omit `auth` entirely and the client sends no `Authorization` header. Useful
against a server that does not require one — a stub or recorded fixture in your
own tests:

```ts
const client = new ContextEngineClient({ baseUrl: "http://localhost:8000" });
```

An `http://` base URL is fine here. Note this is about the _client_ sending no
credentials: a Clinia workspace always requires them, so pointing an
unauthenticated client at one yields 401s on every request rather than a clear
startup failure.

### Bring your own token

For a token you obtained elsewhere, a different grant, or a custom refresh
strategy, pass `auth` a function instead of a config object. It is called per
request and returns the token to attach:

```ts
const client = new ContextEngineClient({
  baseUrl: "https://<workspace-id>.w.clinia.cloud",
  auth: async () => myTokenStore.getValidAccessToken(),
});
```

`createClientCredentialsTokenProvider` returns exactly such a function, so you can
share one cached provider across several clients (or transports):

```ts
import {
  ContextEngineClient,
  createClientCredentialsTokenProvider,
} from "@clinia/context-engine-js";

const getAccessToken = createClientCredentialsTokenProvider({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
});

const client = new ContextEngineClient({ baseUrl, auth: getAccessToken });
// The same provider can also feed a non-REST channel, e.g. an MCP transport.
```

### Middleware

`http.use(...)` / `http.eject(...)` accept
[`openapi-fetch` middleware](https://openapi-ts.dev/openapi-fetch/middleware-auth)
for cross-cutting concerns (logging, tracing, custom headers). The `auth` option
is implemented as such a middleware internally.

## Options

| Option    | Type                                                           | Description                                                                                        |
| --------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `baseUrl` | `string`                                                       | Context Engine workspace base URL. Required.                                                       |
| `fetch`   | `typeof fetch`                                                 | Custom fetch (also used for the token exchange). Defaults to global.                               |
| `auth`    | `ClientCredentialsConfig \| (() => string \| Promise<string>)` | OAuth2 client-credentials config (common case) **or** a per-request token function (escape hatch). |

## Development

```sh
pnpm install
pnpm build      # bundle (tsup) + emit declarations (tsc)
pnpm typecheck
pnpm test
```

`src/generated/` and `src/resources/` are generated from the Context Engine OpenAPI spec on each release. Don't edit them by hand.

The [GitHub repository](https://github.com/clinia/context-engine-js) mirrors each release, so it can't merge pull requests. Report bugs in its [issues](https://github.com/clinia/context-engine-js/issues).

## Changelog

See the [Context Engine changelog](https://docs.clinia.com/changelog).

## License

[Apache-2.0](https://github.com/clinia/context-engine-js/blob/main/LICENSE) © Clinia Health Inc.
