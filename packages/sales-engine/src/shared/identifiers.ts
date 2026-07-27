/**
 * Identifier types for the Sales Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Customer, Employee, Product from Business DNA; Contact, Account from
 * CRM Engine), it is reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { CustomerId, EmployeeId, OrganizationId, ProductBundleId, ProductId } from '@lateen-os/business-dna';
export type { AccountId, ContactId } from '@lateen-os/crm-engine';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Sales Opportunity aggregate identifier. */
export type SalesOpportunityId = Identifier;

/** Quote aggregate identifier. */
export type QuoteId = Identifier;

/** Quote version identifier. */
export type QuoteVersionId = Identifier;

/** Forecast snapshot identifier. */
export type ForecastSnapshotId = Identifier;

/** Commission plan identifier. */
export type CommissionPlanId = Identifier;

/** Sales activity timeline entry identifier. */
export type SalesActivityId = Identifier;

/** Sales task identifier. */
export type SalesTaskId = Identifier;
