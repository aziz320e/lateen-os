/**
 * Identifier types for the AI Security Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Employee from Business DNA; RuntimeAgentId from AI Runtime), it is
 * reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { EmployeeId, OrganizationId } from '@lateen-os/business-dna';
export type { RuntimeAgentId } from '@lateen-os/ai-runtime';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Identity aggregate identifier (AI identity, service identity, session identity, or API key). */
export type IdentityId = Identifier;

/** Role identifier. */
export type RoleId = Identifier;

/** Authorization policy identifier. */
export type PolicyId = Identifier;

/** Secret identifier. */
export type SecretId = Identifier;

/** Provider security policy identifier. */
export type ProviderPolicyId = Identifier;

/** Tool security policy identifier. */
export type ToolPolicyId = Identifier;

/** Data retention rule identifier. */
export type RetentionRuleId = Identifier;

/** Detected threat identifier. */
export type ThreatId = Identifier;

/** Security audit event identifier. */
export type AuditEventId = Identifier;
