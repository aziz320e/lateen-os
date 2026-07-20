/** @module consensus/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgreementId,
  ConsensusResultId,
  MissionId,
  NegotiationId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type VotingStrategy =
  | 'unanimous'
  | 'majority'
  | 'weighted_by_role'
  | 'leader_veto'
  | 'decision_engine';

export type AgreementStatus = 'proposed' | 'accepted' | 'rejected' | 'superseded';

/** Binding agreement reached through consensus. */
export interface Agreement extends TenantAuditableEntity<AgreementId> {
  readonly consensusResultId: ConsensusResultId;
  readonly missionId: MissionId;
  readonly summary: string;
  readonly signatoryWorkerIds: readonly WorkerId[];
  readonly status: AgreementStatus;
  readonly effectiveAt: Timestamp;
}

/** Result of a consensus process among mission workers. */
export interface ConsensusResult extends TenantAuditableEntity<ConsensusResultId> {
  readonly missionId: MissionId;
  readonly negotiationId?: NegotiationId;
  readonly strategy: VotingStrategy;
  readonly reached: boolean;
  readonly agreementScore: ScoreValue;
  readonly agreementId?: AgreementId;
  readonly dissentingWorkerIds: readonly WorkerId[];
  readonly resolvedAt: Timestamp;
}

export type { AgreementId, ConsensusResultId, OrganizationId, WorkerId };
