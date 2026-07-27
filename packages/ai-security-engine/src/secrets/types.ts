/** @module secrets/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { SecretId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { SecretId };

/** Deterministic secret kind. */
export type SecretType = 'generic' | 'provider_credential' | 'encryption_key';

export type SecretStatus = 'active' | 'revoked';

/** A secret's ciphertext and the real AES-256-GCM parameters needed to decrypt it. Never the plaintext. */
export interface Secret extends TenantAuditableEntity<SecretId> {
  readonly secretType: SecretType;
  readonly name: string;
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
  readonly version: number;
  readonly status: SecretStatus;
  readonly rotatedAt?: ISODateTime;
}

export type { OrganizationId } from '../shared/identifiers.js';
