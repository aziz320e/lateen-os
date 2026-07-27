/** @module queries/types */
import type { Account, AccountId, AccountStatus } from '../account/types.js';
import type { Activity, ActivityType, RelatedEntityType } from '../activity/types.js';
import type { Contact, ContactStatus } from '../contact/types.js';
import type { Customer, CustomerId, CustomerStatus } from '../customer/types.js';
import type { Lead, LeadStatus } from '../lead/types.js';
import type { DealStage, Opportunity } from '../opportunity/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';

export interface FindCustomersQuery extends OrganizationScopedQuery {
  readonly status?: CustomerStatus;
}
export interface FindCustomersResult {
  readonly customers: readonly Customer[];
  readonly total: number;
}

export interface FindLeadsQuery extends OrganizationScopedQuery {
  readonly status?: LeadStatus;
}
export interface FindLeadsResult {
  readonly leads: readonly Lead[];
  readonly total: number;
}

export interface FindContactsQuery extends OrganizationScopedQuery {
  readonly status?: ContactStatus;
  readonly customerId?: CustomerId;
  readonly accountId?: AccountId;
}
export interface FindContactsResult {
  readonly contacts: readonly Contact[];
  readonly total: number;
}

export interface FindAccountsQuery extends OrganizationScopedQuery {
  readonly status?: AccountStatus;
}
export interface FindAccountsResult {
  readonly accounts: readonly Account[];
  readonly total: number;
}

export interface FindOpportunitiesQuery extends OrganizationScopedQuery {
  readonly stage?: DealStage;
  readonly accountId?: AccountId;
  readonly customerId?: CustomerId;
}
export interface FindOpportunitiesResult {
  readonly opportunities: readonly Opportunity[];
  readonly total: number;
}

export type FindDealsQuery = OrganizationScopedQuery;
export interface FindDealsResult {
  readonly groupedByStage: Readonly<Record<DealStage, readonly Opportunity[]>>;
  readonly total: number;
}

export interface FindActivitiesQuery extends OrganizationScopedQuery {
  readonly activityType?: ActivityType;
  readonly relatedEntityType?: RelatedEntityType;
  readonly relatedEntityId?: string;
}
export interface FindActivitiesResult {
  readonly activities: readonly Activity[];
  readonly total: number;
}

export type SearchCrmRecordType = 'customer' | 'lead' | 'contact' | 'account' | 'opportunity';

export interface SearchCrmQuery {
  readonly organizationId: OrganizationId;
  readonly keyword: string;
  readonly limit?: number;
}

export interface SearchCrmMatch {
  readonly recordType: SearchCrmRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchCrmResult {
  readonly matches: readonly SearchCrmMatch[];
  readonly total: number;
}
