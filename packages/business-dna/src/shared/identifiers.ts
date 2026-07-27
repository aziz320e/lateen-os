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

/** Business Profile is a singleton per organization — its id is the owning OrganizationId. */
export type BusinessProfileId = OrganizationId;

/** Vision & Mission is a singleton per organization — its id is the owning OrganizationId. */
export type VisionMissionId = OrganizationId;

/** Strategic objective identifier (entity within Vision & Mission). */
export type StrategicObjectiveId = EntityId;

/** Business DNA Profile is a singleton per organization — its id is the owning OrganizationId. */
export type BusinessDnaProfileId = OrganizationId;

/** Ideal Customer Profile identifier (entity within Business DNA Profile). */
export type IcpId = EntityId;

/** Persona identifier (entity within Business DNA Profile). */
export type PersonaId = EntityId;

/** Brand rule identifier (entity within Business DNA Profile). */
export type BrandRuleId = EntityId;

/** Competitive advantage identifier (entity within Business DNA Profile). */
export type CompetitiveAdvantageId = EntityId;

/** Market Model is a singleton per organization — its id is the owning OrganizationId. */
export type MarketModelId = OrganizationId;

/** Operating market identifier (entity within Market Model). */
export type MarketId = EntityId;

/** Competitor aggregate identifier. */
export type CompetitorId = EntityId;

/** Product bundle identifier (entity within Product Catalog). */
export type ProductBundleId = EntityId;
