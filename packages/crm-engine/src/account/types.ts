/** @module account/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag } from '../shared/primitives.js';

export type { AccountId };

export type AccountStatus = 'active' | 'archived';

/** A company-level record — the organizational umbrella above Customers/Contacts/Opportunities. */
export interface Account extends TenantAuditableEntity<AccountId> {
  readonly name: string;
  readonly industry?: string;
  readonly website?: string;
  readonly status: AccountStatus;
  readonly tags: readonly CrmTag[];
}

export type { OrganizationId };
