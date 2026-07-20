/**
 * Branded identifier types for Business DNA aggregates and value objects.
 * All identifiers are opaque strings (UUID) scoped to an organization unless noted.
 *
 * Core tenant identifiers are sourced from `@lateen-os/shared-kernel`.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { BranchId, OrganizationId } from '@lateen-os/shared-kernel/tenant';

export type { OrganizationId, BranchId };

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Unique identifier for a domain event instance. */
export type EventId = Identifier;

/** Department aggregate identifier. */
export type DepartmentId = EntityId;

/** Employee aggregate identifier. */
export type EmployeeId = EntityId;

/** Customer aggregate identifier. */
export type CustomerId = EntityId;

/** Supplier aggregate identifier. */
export type SupplierId = EntityId;

/** Product aggregate identifier. */
export type ProductId = EntityId;

/** Service aggregate identifier. */
export type ServiceId = EntityId;

/** Machine aggregate identifier. */
export type MachineId = EntityId;

/** Project aggregate identifier. */
export type ProjectId = EntityId;

/** Quotation aggregate identifier. */
export type QuotationId = EntityId;

/** Order aggregate identifier. */
export type OrderId = EntityId;

/** Invoice aggregate identifier. */
export type InvoiceId = EntityId;

/** Workflow aggregate identifier. */
export type WorkflowId = EntityId;

/** Workflow stage identifier (entity within Workflow aggregate). */
export type WorkflowStageId = EntityId;

/** Policy aggregate identifier. */
export type PolicyId = EntityId;

/** KPI aggregate identifier. */
export type KpiId = EntityId;

/** Asset aggregate identifier. */
export type AssetId = EntityId;

/** AI Agent aggregate identifier. */
export type AgentId = EntityId;

/** Role aggregate identifier. See `role` module. */
export type RoleId = EntityId;

/** Permission aggregate identifier. See `permission` module. */
export type PermissionId = EntityId;

/** Line item identifier for commercial documents. */
export type LineItemId = EntityId;

/** Core platform identity reference (Layer 2). */
export type IdentityId = EntityId;

/** Site identifier within a Project rollout. */
export type ProjectSiteId = EntityId;

/** Rollout phase identifier within a Project. */
export type RolloutPhaseId = EntityId;

/** Recurring order schedule identifier on a Customer. */
export type RecurringScheduleId = EntityId;
