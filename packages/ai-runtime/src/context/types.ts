/** @module context/types */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentContextId,
  DecisionId,
  GraphNodeType,
  GraphSnapshotId,
  OrganizationId,
  RecommendationCandidateId,
  RuntimeAgentId,
  RuntimeSessionId,
} from '../shared/identifiers.js';

export type { AgentContextId };

/** Reference to Business DNA entity in agent context. */
export interface BusinessContext {
  readonly nodeType: GraphNodeType;
  readonly entityId: Identifier;
  readonly label?: string;
}

/** Reference to Decision Engine context (not the full aggregate). */
export interface DecisionContextReference {
  readonly decisionId: DecisionId;
  readonly recommendationCandidateId?: RecommendationCandidateId;
}

/** Assembled context for an agent during execution. */
export interface AgentContext extends TenantAuditableEntity<AgentContextId> {
  readonly runtimeAgentId: RuntimeAgentId;
  readonly sessionId: RuntimeSessionId;
  readonly businessContext: readonly BusinessContext[];
  readonly graphSnapshotId?: GraphSnapshotId;
  readonly decisionContextRef?: DecisionContextReference;
}

export type { OrganizationId };
