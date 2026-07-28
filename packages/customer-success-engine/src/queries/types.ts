/** @module queries/types */
import type { CustomerSuccessRecord, CustomerSuccessRecordId, CustomerSuccessStatus } from '../customer/types.js';
import type { ExpansionOpportunity, ExpansionOpportunityId, ExpansionOpportunityStatus, ExpansionOpportunityType } from '../expansion/types.js';
import type { FeedbackEntry, FeedbackEntryId, FeedbackType } from '../feedback/types.js';
import type { HealthSnapshot, HealthSnapshotId } from '../health/types.js';
import type { Renewal, RenewalId, RenewalStatus } from '../renewal/types.js';
import type { CustomerRisk, CustomerRiskId, CustomerRiskStatus } from '../risk/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { PlanMilestoneId, PlanObjectiveId, PlanTaskId, SuccessPlan, SuccessPlanId, SuccessPlanStatus } from '../successplan/types.js';

export interface FindCustomersQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly status?: CustomerSuccessStatus;
}

export interface FindCustomersResult {
  readonly records: readonly CustomerSuccessRecord[];
  readonly total: number;
}

export interface FindHealthQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
}

export interface FindHealthResult {
  readonly snapshots: readonly HealthSnapshot[];
  readonly total: number;
}

export interface FindRenewalsQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly status?: RenewalStatus;
}

export interface FindRenewalsResult {
  readonly renewals: readonly Renewal[];
  readonly total: number;
}

export interface FindPlansQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly status?: SuccessPlanStatus;
}

export interface FindPlansResult {
  readonly plans: readonly SuccessPlan[];
  readonly total: number;
}

export interface FindFeedbackQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly feedbackType?: FeedbackType;
}

export interface FindFeedbackResult {
  readonly entries: readonly FeedbackEntry[];
  readonly total: number;
}

export interface FindRisksQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly status?: CustomerRiskStatus;
}

export interface FindRisksResult {
  readonly risks: readonly CustomerRisk[];
  readonly total: number;
}

export interface FindExpansionQuery extends OrganizationScopedQuery {
  readonly customerId?: string;
  readonly opportunityType?: ExpansionOpportunityType;
  readonly status?: ExpansionOpportunityStatus;
}

export interface FindExpansionResult {
  readonly opportunities: readonly ExpansionOpportunity[];
  readonly total: number;
}

export interface SearchCustomerSuccessQuery extends OrganizationScopedQuery {
  readonly keyword: string;
}

export type SearchCustomerSuccessRecordType = 'customer' | 'plan' | 'risk';

export interface SearchCustomerSuccessMatch {
  readonly recordType: SearchCustomerSuccessRecordType;
  readonly id: CustomerSuccessRecordId | SuccessPlanId | CustomerRiskId | HealthSnapshotId | RenewalId | ExpansionOpportunityId | FeedbackEntryId | PlanObjectiveId | PlanMilestoneId | PlanTaskId;
  readonly label: string;
  readonly score: number;
}

export interface SearchCustomerSuccessResult {
  readonly matches: readonly SearchCustomerSuccessMatch[];
  readonly total: number;
}

export type { OrganizationId };
