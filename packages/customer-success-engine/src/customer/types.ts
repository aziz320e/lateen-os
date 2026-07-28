/** @module customer/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CustomerSuccessRecordId } from '../shared/identifiers.js';

export type { CustomerSuccessRecordId };

export type CustomerSuccessStatus = 'onboarding' | 'activation' | 'adoption' | 'expansion' | 'renewal' | 'churn' | 'reactivation';

/**
 * This package's own customer-success aggregate — one per real CRM
 * Engine customer, resolved (never synced) via the Relationship
 * Layer's `getCustomerContext()`.
 */
export interface CustomerSuccessRecord extends TenantAuditableEntity<CustomerSuccessRecordId> {
  /** Opaque foreign key — a real CRM Engine `CustomerId`. */
  readonly customerId: string;
  /** Opaque foreign key — an HR Engine employee acting as customer success owner, resolved only where genuinely needed. */
  readonly ownerId?: string;
  readonly status: CustomerSuccessStatus;
  readonly currentVersion: number;
}
