/** Typed errors used consistently across the API Gateway runtime implementations. @module shared/errors */

export class ApiNotFoundError extends Error {
  constructor(readonly apiId: string) {
    super(`API "${apiId}" not found`);
    this.name = 'ApiNotFoundError';
  }
}

export class InvalidApiTransitionError extends Error {
  constructor(
    readonly apiId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`API "${apiId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidApiTransitionError';
  }
}

export class ApiVersionNotFoundError extends Error {
  constructor(readonly versionId: string) {
    super(`API version "${versionId}" not found`);
    this.name = 'ApiVersionNotFoundError';
  }
}

export class InvalidApiVersionTransitionError extends Error {
  constructor(
    readonly versionId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`API version "${versionId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidApiVersionTransitionError';
  }
}

export class EndpointNotFoundError extends Error {
  constructor(readonly endpointId: string) {
    super(`Endpoint "${endpointId}" not found`);
    this.name = 'EndpointNotFoundError';
  }
}

export class RouteNotFoundError extends Error {
  constructor(readonly routeId: string) {
    super(`Route "${routeId}" not found`);
    this.name = 'RouteNotFoundError';
  }
}

export class DuplicateRouteError extends Error {
  constructor(
    readonly method: string,
    readonly path: string,
  ) {
    super(`Route "${method} ${path}" already exists in this organization`);
    this.name = 'DuplicateRouteError';
  }
}

export class MiddlewareStepNotFoundError extends Error {
  constructor(readonly stepId: string) {
    super(`Middleware step "${stepId}" not found`);
    this.name = 'MiddlewareStepNotFoundError';
  }
}

export class ApiKeyNotFoundError extends Error {
  constructor(readonly apiKeyId: string) {
    super(`API key "${apiKeyId}" not found`);
    this.name = 'ApiKeyNotFoundError';
  }
}

export class PolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Policy "${policyId}" not found`);
    this.name = 'PolicyNotFoundError';
  }
}

export class RateLimitPolicyNotFoundError extends Error {
  constructor(readonly policyId: string) {
    super(`Rate limit policy "${policyId}" not found`);
    this.name = 'RateLimitPolicyNotFoundError';
  }
}

export class QuotaNotFoundError extends Error {
  constructor(readonly quotaId: string) {
    super(`Quota "${quotaId}" not found`);
    this.name = 'QuotaNotFoundError';
  }
}

export class ValidationSchemaNotFoundError extends Error {
  constructor(readonly schemaId: string) {
    super(`Validation schema "${schemaId}" not found`);
    this.name = 'ValidationSchemaNotFoundError';
  }
}

export class RequestContextNotFoundError extends Error {
  constructor(readonly contextId: string) {
    super(`Request context "${contextId}" not found`);
    this.name = 'RequestContextNotFoundError';
  }
}

export class ServiceRegistrationNotFoundError extends Error {
  constructor(readonly serviceName: string) {
    super(`Service "${serviceName}" is not registered`);
    this.name = 'ServiceRegistrationNotFoundError';
  }
}
