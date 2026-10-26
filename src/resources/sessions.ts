// This file is auto-generated. Do not edit manually.
// Generated from the Context Engine OpenAPI spec.

import type { HttpClient } from "../http-client";
import type { AppendMessagesBody } from "../generated/types";

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

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
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

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
  upsertSession(patientId: string, sessionId: string) {
    return this.#http.PUT("/v1/patients/{patientId}/sessions/{sessionId}", {
      params: { path: { patientId, sessionId } },
    });
  }

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
  appendMessages(patientId: string, sessionId: string, body: AppendMessagesBody) {
    return this.#http.POST("/v1/patients/{patientId}/sessions/{sessionId}/messages", {
      params: { path: { patientId, sessionId } },
      body,
    });
  }

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
  generateMemories(patientId: string, sessionId: string) {
    return this.#http.POST("/v1/patients/{patientId}/sessions/{sessionId}/memories", {
      params: { path: { patientId, sessionId } },
    });
  }
}
