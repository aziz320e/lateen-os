/** @module negotiation/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MissionId,
  NegotiationId,
  NegotiationRoundId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { ScoreValue, Timestamp } from '../shared/primitives.js';

export type NegotiationStatus = 'open' | 'in_progress' | 'agreed' | 'deadlocked' | 'cancelled';

export type NegotiationOutcomeType = 'consensus' | 'compromise' | 'escalation' | 'leader_decision' | 'deadlock';

/** Single round of multi-agent negotiation. */
export interface NegotiationRound extends TenantAuditableEntity<NegotiationRoundId> {
  readonly negotiationId: NegotiationId;
  readonly roundNumber: number;
  readonly proposalSummary: string;
  readonly participantWorkerIds: readonly WorkerId[];
  readonly openedAt: Timestamp;
  readonly closedAt?: Timestamp;
}

/** Final outcome of a negotiation process. */
export interface NegotiationOutcome {
  readonly negotiationId: NegotiationId;
  readonly type: NegotiationOutcomeType;
  readonly summary: string;
  readonly agreementScore?: ScoreValue;
  readonly resolvedAt: Timestamp;
}

/** Multi-agent negotiation session for resolving conflicting proposals. */
export interface Negotiation extends TenantAuditableEntity<NegotiationId> {
  readonly missionId: MissionId;
  readonly topic: string;
  readonly status: NegotiationStatus;
  readonly participantWorkerIds: readonly WorkerId[];
  readonly roundIds: readonly NegotiationRoundId[];
  readonly outcome?: NegotiationOutcome;
}

export type { NegotiationId, NegotiationRoundId, OrganizationId, WorkerId };
