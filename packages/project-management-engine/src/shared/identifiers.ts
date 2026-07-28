/**
 * Identifier types for the Project Management Engine bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization
 * from Business DNA), it is reused directly rather than redefined.
 * Sibling-owned entities referenced by this package (customers,
 * employees, AI workers, inventory items/warehouses, GL accounts)
 * are addressed by plain `string` foreign keys — this package never
 * redefines another package's identifier namespace.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { OrganizationId } from '@lateen-os/business-dna';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Project Structure. */
export type PortfolioId = Identifier;
export type ProgramId = Identifier;
export type ProjectId = Identifier;
export type MilestoneId = Identifier;
export type PhaseId = Identifier;

/** Task Management. */
export type ProjectTaskId = Identifier;

/** Resource Planning. */
export type ResourceAssignmentId = Identifier;

/** Scheduling Engine. */
export type ScheduleId = Identifier;

/** Time Tracking. */
export type WorkLogId = Identifier;

/** Budget Tracking. */
export type ProjectBudgetId = Identifier;

/** Material Planning. */
export type MaterialRequirementId = Identifier;

/** Project Risks. */
export type ProjectRiskId = Identifier;

/** Deliverables. */
export type DeliverableId = Identifier;
