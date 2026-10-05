// This file is auto-generated. Do not edit manually.

import type { HttpClient } from "../http-client";
import type { operations } from "../generated/context-engine";

export class GraphResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  listNodes(
    patientId: string,
    type:
      | "extracted_fact"
      | "fact"
      | "extracted_narrative"
      | "narrative_passage"
      | "narrative"
      | "learned_memory"
      | "extracted_clinical_event",
    params?: { query?: { page?: number; perPage?: number } },
  ) {
    return this.#http.GET("/v1/patients/{patientId}/graph/nodes/{type}/items", {
      params: {
        path: { patientId, type },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  listEdges(
    patientId: string,
    type: "resolution_decision" | "resolves_to" | "chunked_into" | "relationship",
    params?: { query?: { page?: number; perPage?: number; touching?: string | string[] } },
  ) {
    return this.#http.GET("/v1/patients/{patientId}/graph/edges/{type}/items", {
      params: {
        path: { patientId, type },
        ...(params?.query !== undefined ? { query: params.query } : {}),
      },
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  getNode(
    patientId: string,
    type:
      | "extracted_fact"
      | "fact"
      | "extracted_narrative"
      | "narrative_passage"
      | "narrative"
      | "learned_memory"
      | "extracted_clinical_event",
    nodeId: string,
  ) {
    return this.#http.GET("/v1/patients/{patientId}/graph/nodes/{type}/items/{nodeId}", {
      params: { path: { patientId, type, nodeId } },
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  getEdge(
    patientId: string,
    type: "resolution_decision" | "resolves_to" | "chunked_into" | "relationship",
    edgeId: string,
  ) {
    return this.#http.GET("/v1/patients/{patientId}/graph/edges/{type}/items/{edgeId}", {
      params: { path: { patientId, type, edgeId } },
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryExtractedFactNodes(
    patientId: string,
    body: NonNullable<
      operations["query-extracted-fact-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/extracted_fact/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryFactNodes(
    patientId: string,
    body: NonNullable<operations["query-fact-nodes"]["requestBody"]>["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/fact/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryExtractedNarrativeNodes(
    patientId: string,
    body: NonNullable<
      operations["query-extracted-narrative-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/extracted_narrative/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryNarrativePassageNodes(
    patientId: string,
    body: NonNullable<
      operations["query-narrative-passage-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/narrative_passage/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryNarrativeNodes(
    patientId: string,
    body: NonNullable<
      operations["query-narrative-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/narrative/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryLearnedMemoryNodes(
    patientId: string,
    body: NonNullable<
      operations["query-learned-memory-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/learned_memory/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryExtractedClinicalEventNodes(
    patientId: string,
    body: NonNullable<
      operations["query-extracted-clinical-event-nodes"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/nodes/extracted_clinical_event/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryResolutionDecisionEdges(
    patientId: string,
    body: NonNullable<
      operations["query-resolution-decision-edges"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/edges/resolution_decision/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryResolvesToEdges(
    patientId: string,
    body: NonNullable<
      operations["query-resolves-to-edges"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/edges/resolves_to/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryChunkedIntoEdges(
    patientId: string,
    body: NonNullable<
      operations["query-chunked-into-edges"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/edges/chunked_into/query", {
      params: { path: { patientId } },
      body,
    });
  }

  /**
   * Technical preview.
   *
   * @experimental
   */
  queryRelationshipEdges(
    patientId: string,
    body: NonNullable<
      operations["query-relationship-edges"]["requestBody"]
    >["content"]["application/json"],
  ) {
    return this.#http.POST("/v1/patients/{patientId}/graph/edges/relationship/query", {
      params: { path: { patientId } },
      body,
    });
  }
}
