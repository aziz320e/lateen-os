/** @module opportunity/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AccountId, ContactId, CustomerId, EmployeeId, SalesOpportunityId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODateTime, SalesTag } from '../shared/primitives.js';

export type { SalesOpportunityId };

/** Deterministic sales pipeline stage. */
export type SalesPipelineStage =
  | 'new'
  | 'discovery'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'verbal_commit'
  | 'won'
  | 'lost';

export type SalesOpportunityStatus = 'active' | 'archived';

/** A potential deal moving through the deterministic sales pipeline. */
export interface SalesOpportunity extends TenantAuditableEntity<SalesOpportunityId> {
  readonly name: string;
  readonly stage: SalesPipelineStage;
  readonly status: SalesOpportunityStatus;
  readonly customerId?: CustomerId;
  readonly contactId?: ContactId;
  readonly accountId?: AccountId;
  readonly ownerId?: EmployeeId;
  readonly amount?: string;
  readonly currency?: CurrencyCode;
  readonly source?: string;
  readonly expectedCloseDate?: ISODateTime;
  /** Stage held immediately before the opportunity closed — restored by `reopen()`. */
  readonly previousStage?: SalesPipelineStage;
  readonly lostReason?: string;
  readonly closedAt?: ISODateTime;
  readonly tags: readonly SalesTag[];
}

export type { OrganizationId } from '../shared/identifiers.js';
