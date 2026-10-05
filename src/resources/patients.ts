// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";

export class PatientsResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  listPatients(params?: { query?: { page?: number; perPage?: number } }) {
    return this.#http.GET("/v1/patients", params ? { params } : undefined);
  }

  getPatient(patientId: string) {
    return this.#http.GET("/v1/patients/{patientId}", { params: { path: { patientId } } });
  }

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
  getResolution(patientId: string, params?: { query?: { page?: number; perPage?: number } }) {
    return this.#http.GET("/v1/patients/{patientId}/resolution", {
      params: {
        path: { patientId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  /**
   * @deprecated This endpoint will be removed in a future release.
   */
  getReconciliation(patientId: string, params?: { query?: { format?: "json" | "markdown" } }) {
    return this.#http.GET("/v1/patients/{patientId}/reconciliation", {
      params: {
        path: { patientId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  deletePatient(patientId: string) {
    return this.#http.DELETE("/v1/patients/{patientId}", { params: { path: { patientId } } });
  }

  upsertPatient(patientId: string) {
    return this.#http.PUT("/v1/patients/{patientId}", { params: { path: { patientId } } });
  }
}
