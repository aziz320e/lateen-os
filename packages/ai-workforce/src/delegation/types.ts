/** @module delegation/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  DelegationId,
  DelegationRuleId,
  OrganizationId,
  TaskId,
  WorkerId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { DelegationId, DelegationRuleId };

export type DelegationStatus =
  | 'requested'
  | 'evaluating'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type DelegationScope = 'task' | 'decision' | 'goal' | 'conversation' | 'full_handoff';

/** Rule governing when and how work may be delegated between workers. */
export interface DelegationRule extends TenantAuditableEntity<DelegationRuleId> {
  readonly name: string;
  readonly description?: string;
  readonly sourceWorkerId: WorkerId;
  readonly targetWorkerIds: readonly WorkerId[];
  readonly allowedScopes: readonly DelegationScope[];
  readonly requiresSupervisorApproval: boolean;
  readonly active: boolean;
}

/** Request to delegate work from one worker to another. */
export interface DelegationRequest extends TenantAuditableEntity<DelegationId> {
  readonly ruleId?: DelegationRuleId;
  readonly sourceWorkerId: WorkerId;
  readonly targetWorkerId: WorkerId;
  readonly scope: DelegationScope;
  readonly taskId?: TaskId;
  readonly decisionId?: DecisionId;
  readonly title: string;
  readonly rationale: string;
  readonly status: DelegationStatus;
  readonly requestedAt: Timestamp;
  readonly resolvedAt?: Timestamp;
}

/** Outcome of a completed delegation. */
export interface DelegationResult {
  readonly delegationId: DelegationId;
  readonly success: boolean;
  readonly summary: string;
  readonly completedAt: Timestamp;
  readonly outputReference?: string;
}

export type { OrganizationId, WorkerId, TaskId };
