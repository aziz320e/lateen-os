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
  CustomerId,
  DepartmentId,
  EmployeeId,
  InvoiceId,
  KpiId,
  MachineId,
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

export type { CapabilityId } from '@lateen-os/capability-engine';

/** Identifier of a node in the domain graph (may differ from entity id in projections). */
export type GraphNodeId = Identifier;

/** Identifier of an edge in the domain graph. */
export type GraphEdgeId = Identifier;

/** Identifier of a graph snapshot. */
export type GraphSnapshotId = Identifier;
