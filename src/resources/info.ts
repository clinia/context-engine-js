// This file is auto-generated. Do not edit manually.
// Generated from the Context Engine OpenAPI spec.

import type { HttpClient } from "../http-client";

export class InfoResource {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  getServiceInfo() {
    return this.#http.GET("/", undefined);
  }
}
