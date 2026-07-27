/** @module customer/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId, CustomerId, LeadId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';

export type { CustomerId };

export type CustomerStatus = 'active' | 'archived' | 'merged';

/** A converted, actively-managed commercial relationship. */
export interface Customer extends TenantAuditableEntity<CustomerId> {
  readonly name: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly accountId?: AccountId;
  readonly status: CustomerStatus;
  readonly tags: readonly CrmTag[];
  /** Set when `status` is `'merged'` — points at the surviving customer record. */
  readonly mergedIntoCustomerId?: CustomerId;
  /** Set when this customer was created by converting a {@link LeadId}. */
  readonly sourceLeadId?: LeadId;
}

export type { OrganizationId };
