/**
 * Identifier types for the CRM Engine bounded context.
 *
 * Where Business DNA already owns a canonical id (Organization, Customer,
 * Employee), it is reused directly rather than redefined — the CRM
 * Engine's one required integration with Business DNA's public API.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { CustomerId, EmployeeId, OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Lead aggregate identifier. */
export type LeadId = Identifier;

/** Contact aggregate identifier. */
export type ContactId = Identifier;

/** Account aggregate identifier. */
export type AccountId = Identifier;

/** Opportunity (deal) aggregate identifier. */
export type OpportunityId = Identifier;

/** Activity timeline entry identifier. */
export type ActivityId = Identifier;
