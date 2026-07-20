/** @module context/types */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  DecisionContextId,
  GraphNodeId,
  GraphNodeType,
  GraphSnapshotId,
  InstitutionalMemoryId,
  KnowledgeEntryId,
  KpiId,
  MetricSnapshotId,
  OrganizationId,
  PolicyId,
} from '../shared/identifiers.js';

export type { DecisionContextId };

/** Reference to a Business DNA entity in decision context. */
export interface BusinessDnaRef {
  readonly nodeType: GraphNodeType;
  readonly entityId: Identifier;
  readonly graphNodeId?: GraphNodeId;
}

/** Reference to capability state relevant to the decision. */
export interface CapabilityRef {
  readonly capabilityId: CapabilityId;
  readonly label?: string;
}

/** Reference to domain graph projection used for reasoning. */
export interface DomainGraphRef {
  readonly snapshotId?: GraphSnapshotId;
  readonly focusNodeIds?: readonly GraphNodeId[];
}

/** Reference to institutional memory artifacts. */
export interface InstitutionalMemoryRef {
  readonly memoryIds?: readonly InstitutionalMemoryId[];
  readonly knowledgeEntryIds?: readonly KnowledgeEntryId[];
}

/** Current metric value snapshot for decision evaluation. */
export interface MetricSnapshot {
  readonly snapshotId: MetricSnapshotId;
  readonly kpiId: KpiId;
  readonly value: string;
  readonly recordedAt: string;
}

/** Active Business DNA or decision policy reference. */
export interface PolicyRef {
  readonly policyId: PolicyId;
  readonly label?: string;
}

/**
 * Assembled context for a decision — references upstream packages only.
 * No AI inference; context assembly is an application/infrastructure concern.
 */
export interface DecisionContext extends TenantAuditableEntity<DecisionContextId> {
  readonly decisionId: Identifier;
  readonly businessDnaRefs: readonly BusinessDnaRef[];
  readonly capabilityRefs: readonly CapabilityRef[];
  readonly domainGraphRef?: DomainGraphRef;
  readonly institutionalMemoryRef?: InstitutionalMemoryRef;
  readonly currentMetrics: readonly MetricSnapshot[];
  readonly currentPolicies: readonly PolicyRef[];
}

export type { OrganizationId };
