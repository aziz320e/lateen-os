/** @module validation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ValidationSchemaId } from '../shared/identifiers.js';

export type { ValidationSchemaId };

export type FieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface FieldSchema {
  readonly field: string;
  readonly type: FieldType;
  readonly required: boolean;
}

export type ValidationSchemaKind = 'request' | 'response';

/** A deterministic, fixed-shape validation schema — no external JSON Schema library, just a real, minimal field-level check. */
export interface ValidationSchema extends TenantAuditableEntity<ValidationSchemaId> {
  readonly name: string;
  readonly kind: ValidationSchemaKind;
  readonly fields: readonly FieldSchema[];
}
