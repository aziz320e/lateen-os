/**
 * Identifier types for the Customer Success Engine bounded context.
 *
 * Sibling-owned entities referenced by this package (CRM customers,
 * sales opportunities, HR employees, project management projects)
 * are addressed by plain `string` foreign keys — this package never
 * redefines another package's identifier namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Customer Lifecycle. */
export type CustomerSuccessRecordId = Identifier;

/** Customer Health. */
export type HealthSnapshotId = Identifier;

/** Success Plans. */
export type SuccessPlanId = Identifier;
export type PlanObjectiveId = Identifier;
export type PlanMilestoneId = Identifier;
export type PlanTaskId = Identifier;

/** Renewals. */
export type RenewalId = Identifier;

/** Expansion. */
export type ExpansionOpportunityId = Identifier;

/** Customer Risks. */
export type CustomerRiskId = Identifier;

/** Feedback. */
export type FeedbackEntryId = Identifier;
