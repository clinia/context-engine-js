// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";
import type { AppendMessagesBody, IngestSessionBody } from "../generated/types";

export class SessionsResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  listSessionMemories(
    patientId: string,
    sessionId: string,
    params?: {
      query?: { page?: number; perPage?: number; sort?: "createdAt"; order?: "asc" | "desc" };
    },
  ) {
    return this.#http.GET("/v1/patients/{patientId}/sessions/{sessionId}/memories", {
      params: {
        path: { patientId, sessionId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  createSession(patientId: string) {
    return this.#http.POST("/v1/patients/{patientId}/sessions", {
      params: { path: { patientId } },
    });
  }

  getSession(patientId: string, sessionId: string) {
    return this.#http.GET("/v1/patients/{patientId}/sessions/{sessionId}", {
      params: { path: { patientId, sessionId } },
    });
  }

  upsertSession(patientId: string, sessionId: string) {
    return this.#http.PUT("/v1/patients/{patientId}/sessions/{sessionId}", {
      params: { path: { patientId, sessionId } },
    });
  }

  appendMessages(patientId: string, sessionId: string, body: AppendMessagesBody) {
    return this.#http.POST("/v1/patients/{patientId}/sessions/{sessionId}/messages", {
      params: { path: { patientId, sessionId } },
      body,
    });
  }

  generateMemories(patientId: string, sessionId: string) {
    return this.#http.POST("/v1/patients/{patientId}/sessions/{sessionId}/memories", {
      params: { path: { patientId, sessionId } },
    });
  }

  ingestSession(patientId: string, body: IngestSessionBody) {
    return this.#http.POST("/v1/patients/{patientId}/sessions/ingest", {
      params: { path: { patientId } },
      body,
    });
  }
}
