import { describe, expect, it } from "vitest";
import { ContextEngineClient } from "./context-engine-client";
import {
  GraphResource,
  InfoResource,
  IngestResource,
  PatientsResource,
  SessionsResource,
  VFSResource,
} from "./resources";

/**
 * `implements Resources` compile-checks the property list; what those properties are wired to
 * at runtime it cannot see. These assertions cover that half: each one holds a real resource,
 * and they all share a single http client.
 */
describe("ContextEngineClient", () => {
  const client = new ContextEngineClient({ baseUrl: "http://engine.test" });

  it("carries one instance of every resource", () => {
    expect(client.info).toBeInstanceOf(InfoResource);
    expect(client.patients).toBeInstanceOf(PatientsResource);
    expect(client.ingest).toBeInstanceOf(IngestResource);
    expect(client.sessions).toBeInstanceOf(SessionsResource);
    expect(client.vfs).toBeInstanceOf(VFSResource);
    expect(client.graph).toBeInstanceOf(GraphResource);
  });

  it("keeps the low-level http client reachable", () => {
    expect(typeof client.http.GET).toBe("function");
  });

  it("routes every resource through one http client, so auth is configured once", async () => {
    const seen: string[] = [];
    const authed = new ContextEngineClient({
      baseUrl: "http://engine.test",
      auth: () => "token-1",
      fetch: async (input, init) => {
        seen.push(new Request(input, init).headers.get("Authorization") ?? "");
        return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
      },
    });

    await authed.patients.listPatients();
    await authed.ingest.listIngestions("patient-1");

    expect(seen).toEqual(["Bearer token-1", "Bearer token-1"]);
  });
});
