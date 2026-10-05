// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";

export class VFSResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  browseVfs(patientId: string, params?: { query?: { path?: string } }) {
    return this.#http.GET("/v1/patients/{patientId}/vfs", {
      params: {
        path: { patientId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  readVfs(
    patientId: string,
    params?: {
      query?: {
        path?: string;
        format?: "narrative" | "structured" | "compact";
        token_budget?: number;
      };
    },
  ) {
    return this.#http.GET("/v1/patients/{patientId}/read", {
      params: {
        path: { patientId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }
}
