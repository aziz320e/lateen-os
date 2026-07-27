/**
 * Identifier types for the Marketing Engine bounded context.
 *
 * Where Business DNA already owns a canonical id (Organization, Customer,
 * Employee), it is reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { CustomerId, EmployeeId, OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Campaign aggregate identifier. */
export type CampaignId = Identifier;

/** Audience aggregate identifier. */
export type AudienceId = Identifier;

/** Marketing-generated lead identifier. */
export type MarketingLeadId = Identifier;

/** Content library item identifier. */
export type ContentItemId = Identifier;

/** Marketing calendar entry identifier. */
export type CalendarEntryId = Identifier;

/** Attribution touchpoint identifier. */
export type TouchpointId = Identifier;

/** Workflow integration request identifier. */
export type WorkflowRequestId = Identifier;
