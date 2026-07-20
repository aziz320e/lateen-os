/** @module delegation/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CollaborationDelegationId,
  DelegationPolicyId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MissionWorkerRole, Timestamp } from '../shared/primitives.js';

export type DelegationStatus = 'requested' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

/** Policy governing inter-worker delegation within a mission. */
export interface DelegationPolicy extends TenantAuditableEntity<DelegationPolicyId> {
  readonly missionId: MissionId;
  readonly name: string;
  readonly sourceRole: MissionWorkerRole;
  readonly targetRoles: readonly MissionWorkerRole[];
  readonly maxDepth: number;
  readonly requiresLeaderApproval: boolean;
  readonly active: boolean;
}

/** Request to delegate part of a mission objective to another worker. */
export interface DelegationRequest extends TenantAuditableEntity<CollaborationDelegationId> {
  readonly missionId: MissionId;
  readonly policyId?: DelegationPolicyId;
  readonly sourceWorkerId: WorkerId;
  readonly targetWorkerId: WorkerId;
  readonly objective: string;
  readonly rationale: string;
  readonly status: DelegationStatus;
  readonly requestedAt: Timestamp;
}

/** Response to a delegation request. */
export interface DelegationResponse {
  readonly delegationId: CollaborationDelegationId;
  readonly accepted: boolean;
  readonly responderWorkerId: WorkerId;
  readonly comment?: string;
  readonly respondedAt: Timestamp;
}

export type { CollaborationDelegationId, DelegationPolicyId, OrganizationId, WorkerId };
