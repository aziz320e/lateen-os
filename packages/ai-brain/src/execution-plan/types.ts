/** @module execution-plan/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ExecutionCheckpointId,
  ExecutionEdgeId,
  ExecutionGraphId,
  ExecutionNodeId,
  OrganizationId,
} from '../shared/identifiers.js';

export type {
  ExecutionGraphId,
  ExecutionNodeId,
  ExecutionEdgeId,
  ExecutionCheckpointId,
  OrganizationId,
};

export type ExecutionNodeKind =
  | 'service_call'
  | 'workflow_start'
  | 'mission_start'
  | 'worker_delegate'
  | 'decision_gate'
  | 'validation'
  | 'checkpoint'
  | 'parallel_fork'
  | 'parallel_join';

export type ExecutionNodeStatus = 'pending' | 'ready' | 'running' | 'completed' | 'skipped' | 'failed';

/** Single node in an execution graph. */
export interface ExecutionNode extends TenantAuditableEntity<ExecutionNodeId> {
  readonly graphId: ExecutionGraphId;
  readonly kind: ExecutionNodeKind;
  readonly label: string;
  readonly targetRef: string;
  readonly status: ExecutionNodeStatus;
  readonly order: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type ExecutionEdgeKind = 'sequential' | 'conditional' | 'parallel' | 'fallback';

/** Directed edge between execution nodes. */
export interface ExecutionEdge extends TenantAuditableEntity<ExecutionEdgeId> {
  readonly graphId: ExecutionGraphId;
  readonly fromNodeId: ExecutionNodeId;
  readonly toNodeId: ExecutionNodeId;
  readonly kind: ExecutionEdgeKind;
  readonly condition?: string;
}

export type ExecutionCheckpointStatus = 'pending' | 'passed' | 'failed' | 'skipped';

/** Validation gate within an execution graph. */
export interface ExecutionCheckpoint extends TenantAuditableEntity<ExecutionCheckpointId> {
  readonly graphId: ExecutionGraphId;
  readonly nodeId: ExecutionNodeId;
  readonly label: string;
  readonly status: ExecutionCheckpointStatus;
  readonly validationRef: string;
}

/** Directed acyclic graph describing how platform actions execute. */
export interface ExecutionGraph extends TenantAuditableEntity<ExecutionGraphId> {
  readonly label: string;
  readonly nodes: readonly ExecutionNode[];
  readonly edges: readonly ExecutionEdge[];
  readonly checkpoints: readonly ExecutionCheckpoint[];
}
