/** @module opportunity/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId, ContactId, CustomerId, OpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { CrmTag, CurrencyCode, ISODateTime } from '../shared/primitives.js';

export type { OpportunityId };

/** Deterministic pipeline stage. */
export type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

/** A potential deal moving through the sales pipeline. */
export interface Opportunity extends TenantAuditableEntity<OpportunityId> {
  readonly name: string;
  readonly stage: DealStage;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly accountId?: AccountId;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly expectedCloseDate?: ISODateTime;
  readonly probability?: string;
  readonly lostReason?: string;
  readonly closedAt?: ISODateTime;
  readonly tags: readonly CrmTag[];
}

export type { OrganizationId };
