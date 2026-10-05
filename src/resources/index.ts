// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";
import { InfoResource } from "./info";
import { PatientsResource } from "./patients";
import { IngestResource } from "./ingest";
import { SessionsResource } from "./sessions";
import { VFSResource } from "./vfs";
import { GraphResource } from "./graph";

export { InfoResource } from "./info";
export { PatientsResource } from "./patients";
export { IngestResource } from "./ingest";
export { SessionsResource } from "./sessions";
export { VFSResource } from "./vfs";
export { GraphResource } from "./graph";

/** Every resource, under the property it takes on `ContextEngineClient`. */
export interface Resources {
  readonly info: InfoResource;
  readonly patients: PatientsResource;
  readonly ingest: IngestResource;
  readonly sessions: SessionsResource;
  readonly vfs: VFSResource;
  readonly graph: GraphResource;
}

/**
 * Build one of each resource over a shared http client.
 *
 * Generated alongside the classes, so a new tag in the spec lands here on its own and
 * `ContextEngineClient` fails to compile until it names the new property.
 */
export function createResources(http: HttpClient): Resources {
  return {
    info: new InfoResource(http),
    patients: new PatientsResource(http),
    ingest: new IngestResource(http),
    sessions: new SessionsResource(http),
    vfs: new VFSResource(http),
    graph: new GraphResource(http),
  };
}
