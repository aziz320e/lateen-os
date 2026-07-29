/** @module authentication/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ApiKeyId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { ApiKeyId };

export type ApiKeyStatus = 'active' | 'revoked';

/**
 * An issued API key. The raw key is never stored — only a SHA-256
 * hash of it — so a leaked database dump can never be turned back
 * into a usable credential.
 */
export interface ApiKey extends TenantAuditableEntity<ApiKeyId> {
  readonly name: string;
  readonly keyHash: string;
  readonly prefix: string;
  readonly status: ApiKeyStatus;
  readonly scopes: readonly string[];
  readonly expiresAt?: ISODateTime;
}
