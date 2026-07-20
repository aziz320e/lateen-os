/** @module escalation/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  EscalationDecisionId,
  EscalationRequestId,
  MissionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { MissionWorkerRole, Timestamp } from '../shared/primitives.js';

export type EscalationLevel = 'team_lead' | 'ceo_ai' | 'decision_engine' | 'human_operator';

export type EscalationStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

/** Decision made in response to an escalation. */
export interface EscalationDecision extends TenantAuditableEntity<EscalationDecisionId> {
  readonly escalationRequestId: EscalationRequestId;
  readonly level: EscalationLevel;
  readonly decisionId?: DecisionId;
  readonly resolverWorkerId?: WorkerId;
  readonly resolution: string;
  readonly resolvedAt: Timestamp;
}

/** Request to escalate unresolved mission conflict or blocker. */
export interface EscalationRequest extends TenantAuditableEntity<EscalationRequestId> {
  readonly missionId: MissionId;
  readonly reason: string;
  readonly currentLevel: EscalationLevel;
  readonly targetLevel: EscalationLevel;
  readonly requesterWorkerId: WorkerId;
  readonly status: EscalationStatus;
  readonly decision?: EscalationDecision;
}

export type { EscalationRequestId, EscalationDecisionId, OrganizationId, WorkerId };
