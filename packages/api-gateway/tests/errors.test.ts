import { describe, expect, it } from 'vitest';
import {
  ApiKeyNotFoundError,
  ApiNotFoundError,
  ApiVersionNotFoundError,
  DuplicateRouteError,
  EndpointNotFoundError,
  InvalidApiTransitionError,
  InvalidApiVersionTransitionError,
  MiddlewareStepNotFoundError,
  PolicyNotFoundError,
  QuotaNotFoundError,
  RateLimitPolicyNotFoundError,
  RequestContextNotFoundError,
  RouteNotFoundError,
  ServiceRegistrationNotFoundError,
  ValidationSchemaNotFoundError,
} from '../src/shared/errors.js';

describe('shared/errors — typed error classes', () => {
  it('ApiNotFoundError carries the apiId and a descriptive message', () => {
    const error = new ApiNotFoundError('api-1');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiNotFoundError');
    expect(error.apiId).toBe('api-1');
    expect(error.message).toBe('API "api-1" not found');
  });

  it('InvalidApiTransitionError carries apiId/from/to and a descriptive message', () => {
    const error = new InvalidApiTransitionError('api-1', 'retired', 'active');
    expect(error.name).toBe('InvalidApiTransitionError');
    expect(error.apiId).toBe('api-1');
    expect(error.from).toBe('retired');
    expect(error.to).toBe('active');
    expect(error.message).toBe('API "api-1" cannot transition from "retired" to "active"');
  });

  it('ApiVersionNotFoundError carries the versionId and a descriptive message', () => {
    const error = new ApiVersionNotFoundError('version-1');
    expect(error.name).toBe('ApiVersionNotFoundError');
    expect(error.versionId).toBe('version-1');
    expect(error.message).toBe('API version "version-1" not found');
  });

  it('InvalidApiVersionTransitionError carries versionId/from/to and a descriptive message', () => {
    const error = new InvalidApiVersionTransitionError('version-1', 'draft', 'retired');
    expect(error.name).toBe('InvalidApiVersionTransitionError');
    expect(error.versionId).toBe('version-1');
    expect(error.message).toBe('API version "version-1" cannot transition from "draft" to "retired"');
  });

  it('EndpointNotFoundError carries the endpointId and a descriptive message', () => {
    const error = new EndpointNotFoundError('endpoint-1');
    expect(error.name).toBe('EndpointNotFoundError');
    expect(error.endpointId).toBe('endpoint-1');
    expect(error.message).toBe('Endpoint "endpoint-1" not found');
  });

  it('RouteNotFoundError carries the routeId and a descriptive message', () => {
    const error = new RouteNotFoundError('route-1');
    expect(error.name).toBe('RouteNotFoundError');
    expect(error.routeId).toBe('route-1');
    expect(error.message).toBe('Route "route-1" not found');
  });

  it('DuplicateRouteError carries method/path and a descriptive message', () => {
    const error = new DuplicateRouteError('GET', '/crm/customers');
    expect(error.name).toBe('DuplicateRouteError');
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/crm/customers');
    expect(error.message).toBe('Route "GET /crm/customers" already exists in this organization');
  });

  it('MiddlewareStepNotFoundError carries the stepId and a descriptive message', () => {
    const error = new MiddlewareStepNotFoundError('step-1');
    expect(error.name).toBe('MiddlewareStepNotFoundError');
    expect(error.stepId).toBe('step-1');
    expect(error.message).toBe('Middleware step "step-1" not found');
  });

  it('ApiKeyNotFoundError carries the apiKeyId and a descriptive message', () => {
    const error = new ApiKeyNotFoundError('key-1');
    expect(error.name).toBe('ApiKeyNotFoundError');
    expect(error.apiKeyId).toBe('key-1');
    expect(error.message).toBe('API key "key-1" not found');
  });

  it('PolicyNotFoundError carries the policyId and a descriptive message', () => {
    const error = new PolicyNotFoundError('policy-1');
    expect(error.name).toBe('PolicyNotFoundError');
    expect(error.policyId).toBe('policy-1');
    expect(error.message).toBe('Policy "policy-1" not found');
  });

  it('RateLimitPolicyNotFoundError carries the policyId and a descriptive message', () => {
    const error = new RateLimitPolicyNotFoundError('policy-1');
    expect(error.name).toBe('RateLimitPolicyNotFoundError');
    expect(error.policyId).toBe('policy-1');
    expect(error.message).toBe('Rate limit policy "policy-1" not found');
  });

  it('QuotaNotFoundError carries the quotaId and a descriptive message', () => {
    const error = new QuotaNotFoundError('quota-1');
    expect(error.name).toBe('QuotaNotFoundError');
    expect(error.quotaId).toBe('quota-1');
    expect(error.message).toBe('Quota "quota-1" not found');
  });

  it('ValidationSchemaNotFoundError carries the schemaId and a descriptive message', () => {
    const error = new ValidationSchemaNotFoundError('schema-1');
    expect(error.name).toBe('ValidationSchemaNotFoundError');
    expect(error.schemaId).toBe('schema-1');
    expect(error.message).toBe('Validation schema "schema-1" not found');
  });

  it('RequestContextNotFoundError carries the contextId and a descriptive message', () => {
    const error = new RequestContextNotFoundError('context-1');
    expect(error.name).toBe('RequestContextNotFoundError');
    expect(error.contextId).toBe('context-1');
    expect(error.message).toBe('Request context "context-1" not found');
  });

  it('ServiceRegistrationNotFoundError carries the serviceName and a descriptive message', () => {
    const error = new ServiceRegistrationNotFoundError('crm-engine');
    expect(error.name).toBe('ServiceRegistrationNotFoundError');
    expect(error.serviceName).toBe('crm-engine');
    expect(error.message).toBe('Service "crm-engine" is not registered');
  });
});
