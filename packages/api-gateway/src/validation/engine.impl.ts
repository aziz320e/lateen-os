/**
 * Real Validation engine — Request Validation, Response Validation,
 * and Response Normalization. A fixed, minimal field-level schema
 * check (required + primitive-type), never a full JSON Schema
 * implementation or an external validation library — deterministic
 * and dependency-free.
 *
 * @module validation/engine.impl
 */
import { ValidationSchemaNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ValidationSchemaId } from '../shared/identifiers.js';
import type { ValidationSchemaRepository } from './repository.js';
import type { FieldSchema, FieldType, ValidationSchema, ValidationSchemaKind } from './types.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

function typeOf(value: unknown): FieldType | 'undefined' | 'null' {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const jsType = typeof value;
  if (jsType === 'string' || jsType === 'number' || jsType === 'boolean' || jsType === 'object') return jsType;
  return 'undefined';
}

/** Deterministic field-level validation: every `required` field must be present, and every present field must match its declared type. */
export function validateAgainstSchema(fields: readonly FieldSchema[], data: Readonly<Record<string, unknown>>): ValidationResult {
  const errors: string[] = [];
  for (const field of fields) {
    const value = data[field.field];
    const actualType = typeOf(value);
    if (actualType === 'undefined' || actualType === 'null') {
      if (field.required) errors.push(`"${field.field}" is required`);
      continue;
    }
    if (actualType !== field.type) {
      errors.push(`"${field.field}" must be of type "${field.type}", got "${actualType}"`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export interface NormalizedResponseMeta {
  readonly correlationId: string;
  readonly timestamp: string;
}

export interface NormalizedResponse {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: { readonly message: string };
  readonly meta: NormalizedResponseMeta;
}

/** A fixed response envelope — never a heuristic or content-dependent shape. */
export function normalizeResponse(input: { readonly data?: unknown; readonly errorMessage?: string; readonly correlationId: string; readonly now: string }): NormalizedResponse {
  return input.errorMessage === undefined
    ? { success: true, data: input.data, meta: { correlationId: input.correlationId, timestamp: input.now } }
    : { success: false, error: { message: input.errorMessage }, meta: { correlationId: input.correlationId, timestamp: input.now } };
}

export interface RegisterValidationSchemaInput {
  readonly name: string;
  readonly kind: ValidationSchemaKind;
  readonly fields: readonly FieldSchema[];
}

export interface ValidationEngine {
  registerSchema(organizationId: OrganizationId, input: RegisterValidationSchemaInput): Promise<ValidationSchema>;
  validate(organizationId: OrganizationId, schemaId: ValidationSchemaId, data: Readonly<Record<string, unknown>>): Promise<ValidationResult>;
  get(organizationId: OrganizationId, schemaId: ValidationSchemaId): Promise<ValidationSchema | null>;
  list(organizationId: OrganizationId): Promise<readonly ValidationSchema[]>;
}

/** Creates a real {@link ValidationEngine}. */
export function createValidationEngine(repository: ValidationSchemaRepository, now: () => string = nowIso): ValidationEngine {
  return {
    async registerSchema(organizationId, input) {
      const timestamp = now();
      const schema: ValidationSchema = {
        id: generateId('gateway-schema'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        kind: input.kind,
        fields: input.fields,
      };
      await repository.save(schema);
      return schema;
    },

    async validate(organizationId, schemaId, data) {
      const schema = await repository.findById(organizationId, schemaId);
      if (!schema) throw new ValidationSchemaNotFoundError(schemaId);
      return validateAgainstSchema(schema.fields, data);
    },

    async get(organizationId, schemaId) {
      return repository.findById(organizationId, schemaId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
