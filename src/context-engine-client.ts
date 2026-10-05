import { HttpClient, type HttpClientOptions } from "./http-client";
import {
  createResources,
  GraphResource,
  InfoResource,
  IngestResource,
  PatientsResource,
  SessionsResource,
  VFSResource,
  type Resources,
} from "./resources";

export type ContextEngineClientOptions = HttpClientOptions;

/**
 * Client for the Clinia Context Engine API.
 *
 * Each area of the API is a resource property — `client.patients`, `client.ingest`,
 * `client.graph` — and `http` stays available underneath for anything a resource method does
 * not cover. Every resource shares that one http client, so authentication is configured once.
 *
 * `implements Resources` is what keeps this list honest: the resources are generated from the
 * API spec, and a new one is a compile error here until it is named.
 */
export class ContextEngineClient implements Resources {
  /**
   * Low-level http client. Use when a resource method does not cover your use case.
   */
  readonly http: HttpClient;

  readonly info: InfoResource;
  readonly patients: PatientsResource;
  readonly ingest: IngestResource;
  readonly sessions: SessionsResource;
  readonly vfs: VFSResource;
  readonly graph: GraphResource;

  constructor(options: ContextEngineClientOptions) {
    this.http = new HttpClient(options);

    const resources = createResources(this.http);
    this.info = resources.info;
    this.patients = resources.patients;
    this.ingest = resources.ingest;
    this.sessions = resources.sessions;
    this.vfs = resources.vfs;
    this.graph = resources.graph;
  }
}
