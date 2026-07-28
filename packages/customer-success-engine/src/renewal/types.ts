/** @module renewal/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { RenewalId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate, ISODateTime } from '../shared/primitives.js';

export type { RenewalId };

export type RenewalStatus = 'pipeline' | 'reminder_sent' | 'at_risk' | 'won' | 'lost';

export interface RenewalReminder {
  readonly sentAt: ISODateTime;
  readonly channel?: string;
}

/** A single renewal opportunity for a customer contract/subscription. */
export interface Renewal extends TenantAuditableEntity<RenewalId> {
  readonly customerId: string;
  readonly renewalDate: ISODate;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly probability: number;
  readonly status: RenewalStatus;
  readonly reminders: readonly RenewalReminder[];
}
