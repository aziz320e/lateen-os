/** @module identity/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { IdentityId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { IdentityId };

/** Deterministic identity kind. */
export type IdentityType = 'ai_identity' | 'service_identity' | 'session_identity' | 'api_key';

export type IdentityStatus = 'active' | 'revoked' | 'expired';

/** A security principal — an AI identity, a service identity, a session, or an API key. */
export interface Identity extends TenantAuditableEntity<IdentityId> {
  readonly identityType: IdentityType;
  readonly name: string;
  readonly status: IdentityStatus;
  /** External reference id — e.g. a Business DNA EmployeeId or an AI Runtime RuntimeAgentId, depending on `identityType`. */
  readonly referenceId?: string;
  /** SHA-256 hash of the session token or API key. Only set for `session_identity` and `api_key`. Plaintext is never stored. */
  readonly secretHash?: string;
  readonly expiresAt?: ISODateTime;
  readonly revokedAt?: ISODateTime;
}

export type { OrganizationId } from '../shared/identifiers.js';
