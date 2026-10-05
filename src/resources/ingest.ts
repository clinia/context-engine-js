// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";
import { toFormData } from "../form-data";
import type { operations } from "../generated/context-engine";
import type { IngestFhirBody } from "../generated/types";

export class IngestResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  listIngestions(
    patientId: string,
    params?: {
      query?: {
        page?: number;
        perPage?: number;
        sort?: "receivedAt";
        order?: "asc" | "desc";
        status?: ("pending" | "processing" | "succeeded" | "partial" | "failed")[];
      };
    },
  ) {
    return this.#http.GET("/v1/patients/{patientId}/ingestions", {
      params: {
        path: { patientId },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  getIngestion(patientId: string, ingestionId: string) {
    return this.#http.GET("/v1/patients/{patientId}/ingestions/{ingestionId}", {
      params: { path: { patientId, ingestionId } },
    });
  }

  ingestFhirR4(patientId: string, body: IngestFhirBody) {
    return this.#http.POST("/v1/patients/{patientId}/ingestions/fhir/r4", {
      params: { path: { patientId } },
      body,
    });
  }

  ingestFhirR5(patientId: string, body: IngestFhirBody) {
    return this.#http.POST("/v1/patients/{patientId}/ingestions/fhir/r5", {
      params: { path: { patientId } },
      body,
    });
  }

  ingestCdaR2(
    patientId: string,
    body: NonNullable<operations["ingest-cda-r2"]["requestBody"]>["content"]["application/cda+xml"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/ingestions/cda/r2", {
      params: { path: { patientId } },
      body,
      bodySerializer: (b: unknown) => (typeof b === "string" ? b : JSON.stringify(b)),
      headers: { "Content-Type": "application/cda+xml" },
    });
  }

  ingestCdaR2Multipart(
    patientId: string,
    body: NonNullable<operations["ingest-cda-r2"]["requestBody"]>["content"]["multipart/form-data"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/ingestions/cda/r2", {
      params: { path: { patientId } },
      body,
      bodySerializer: (b: unknown) => toFormData(b),
    });
  }
}
