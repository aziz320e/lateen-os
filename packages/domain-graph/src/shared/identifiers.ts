/**
 * Graph-scoped identifier types.
 *
 * Entity identifiers are re-exported from Business DNA and Capability Engine.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type {
  AgentId,
  AssetId,
  BranchId,
  CompetitorId,
  CustomerId,
  DepartmentId,
  EmployeeId,
  InvoiceId,
  KpiId,
  MachineId,
  MarketId,
  OrderId,
  OrganizationId,
  PolicyId,
  ProductId,
  ProjectId,
  QuotationId,
  ServiceId,
  SupplierId,
  WorkflowId,
} from '@lateen-os/business-dna';

/** Sales lead — not yet a canonical Business DNA aggregate; scoped to the domain graph. */
export type LeadId = Identifier;

/** Individual contact person — not yet a canonical Business DNA aggregate; scoped to the domain graph. */
export type ContactId = Identifier;

/** Multi-agent mission — scoped to the domain graph to avoid a cross-package dependency on `@lateen-os/multi-agent`. */
export type MissionId = Identifier;

/** Institutional Memory knowledge entry, referenced generically to avoid a cross-package dependency. */
export type KnowledgeId = Identifier;

/** External or internal document reference. */
export type DocumentId = Identifier;

/** Marketing or sales campaign. */
export type CampaignId = Identifier;

export type { CapabilityId } from '@lateen-os/capability-engine';

/** Identifier of a node in the domain graph (may differ from entity id in projections). */
export type GraphNodeId = Identifier;

/** Identifier of an edge in the domain graph. */
export type GraphEdgeId = Identifier;

/** Identifier of a graph snapshot. */
export type GraphSnapshotId = Identifier;

/** Identifier of a real, lifecycle-managed {@link DomainGraph} container. */
export type DomainGraphId = Identifier;
