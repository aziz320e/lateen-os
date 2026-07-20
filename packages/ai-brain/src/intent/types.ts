/** @module intent/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { IntentEntityId, IntentId, IntentParameterId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { IntentId, IntentEntityId, IntentParameterId, OrganizationId };

/** High-level category of user or system intent. */
export type IntentType =
  | 'query'
  | 'command'
  | 'mission'
  | 'workflow'
  | 'decision'
  | 'analysis'
  | 'collaboration'
  | 'automation'
  | 'clarification'
  | 'unknown';

/** Confidence band for intent recognition. */
export type IntentConfidenceLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

/** Confidence score and rationale for a recognized intent. */
export interface IntentConfidence {
  readonly level: IntentConfidenceLevel;
  readonly score: ScoreValue;
  readonly rationale?: string;
}

/** Named entity extracted from natural language or structured input. */
export interface IntentEntity extends TenantAuditableEntity<IntentEntityId> {
  readonly intentId: IntentId;
  readonly kind: string;
  readonly label: string;
  readonly value: string;
  readonly sourceSpan?: string;
}

/** Structured parameter bound to an intent. */
export interface IntentParameter extends TenantAuditableEntity<IntentParameterId> {
  readonly intentId: IntentId;
  readonly name: string;
  readonly value: string | number | boolean | null;
  readonly required: boolean;
}

/** Recognized intent — what the user or system wants to accomplish. */
export interface Intent extends TenantAuditableEntity<IntentId> {
  readonly sessionId: string;
  readonly type: IntentType;
  readonly summary: string;
  readonly rawInput: string;
  readonly confidence: IntentConfidence;
  readonly entities: readonly IntentEntity[];
  readonly parameters: readonly IntentParameter[];
  readonly language?: string;
}
