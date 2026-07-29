/** @module documentation/types */

/** A minimal, real, deterministic OpenAPI 3.0-shaped document — derived purely from the Registry, never hand-maintained separately. */
export interface OpenApiOperation {
  readonly operationId: string;
  readonly summary?: string;
  readonly tags: readonly string[];
}

export interface OpenApiDocument {
  readonly openapi: '3.0.3';
  readonly info: { readonly title: string; readonly version: string };
  readonly paths: Readonly<Record<string, Readonly<Record<string, OpenApiOperation>>>>;
}

/** A human-readable documentation model — the same underlying data as the OpenAPI model, shaped for direct rendering. */
export interface ApiDocumentationRoute {
  readonly method: string;
  readonly path: string;
  readonly requiresAuth: boolean;
}

export interface ApiDocumentationEndpoint {
  readonly name: string;
  readonly description?: string;
  readonly routes: readonly ApiDocumentationRoute[];
}

export interface ApiDocumentationModel {
  readonly apiCode: string;
  readonly apiName: string;
  readonly version: string;
  readonly endpoints: readonly ApiDocumentationEndpoint[];
}
