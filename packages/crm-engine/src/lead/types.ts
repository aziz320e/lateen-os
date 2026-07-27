/** @module lead/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CustomerId, LeadId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, Email, Phone } from '../shared/primitives.js';

export type { LeadId };

export type LeadStatus = 'new' | 'qualified' | 'converted' | 'rejected';

/** A prospective customer not yet converted. */
export interface Lead extends TenantAuditableEntity<LeadId> {
  readonly name: string;
  readonly email?: Email;
  readonly phone?: Phone;
  readonly company?: string;
  readonly source?: string;
  readonly status: LeadStatus;
  readonly tags: readonly CrmTag[];
  readonly rejectionReason?: string;
  /** Set once `status` is `'converted'`. */
  readonly convertedCustomerId?: CustomerId;
}

export type { OrganizationId };
