/**
 * Real Conflict Resolution — resolves a detected {@link Conflict} by
 * role-weighted vote (real tally, real tie detection), by leader decision,
 * or by escalation (delegates to the real Escalation service, which may
 * itself consult AI Brain for `'ceo_ai'`-level escalations).
 *
 * @module conflict/resolver.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { DecisionProposalRepository } from '../conversation/repository.js';
import type { DecisionProposalId } from '../conversation/types.js';
import type { EscalationService } from '../escalation/service.impl.js';
import type { CollaborationEventBus } from '../events/collaboration-event-bus.js';
import { ConflictAlreadyResolvedError, ConflictNotFoundError } from '../shared/errors.js';
import { nowIso } from '../shared/id.js';
import type { EscalationRequestId, MissionId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole } from '../shared/primitives.js';
import type { ConflictRepository } from './repository.js';
import type { Conflict, ConflictId } from './types.js';

const ROLE_WEIGHT: Readonly<Record<MissionWorkerRole, number>> = {
  ceo_ai: 3,
  product_manager_ai: 2,
  marketing_ai: 1,
  sales_ai: 1,
  operations_ai: 1,
  finance_ai: 1,
  hr_ai: 1,
};

export interface ProposalVote {
  readonly workerId: WorkerId;
  readonly role: MissionWorkerRole;
  readonly proposalId: DecisionProposalId;
}

export interface VoteTallyOutcome {
  readonly winningProposalId?: DecisionProposalId;
  readonly tied: boolean;
  readonly tally: ReadonlyMap<DecisionProposalId, number>;
}

/** Pure, deterministic role-weighted vote tally. A tie (including zero votes) yields no winner. */
export function tallyProposalVotes(votes: readonly ProposalVote[]): VoteTallyOutcome {
  const tally = new Map<DecisionProposalId, number>();
  for (const vote of votes) {
    tally.set(vote.proposalId, (tally.get(vote.proposalId) ?? 0) + ROLE_WEIGHT[vote.role]);
  }
  if (tally.size === 0) return { tied: true, tally };

  const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const [topProposalId, topScore] = sorted[0]!;
  const tied = sorted.length > 1 && sorted[1]![1] === topScore;
  return { winningProposalId: tied ? undefined : topProposalId, tied, tally };
}

export interface ConflictResolver {
  resolveByVote(organizationId: OrganizationId, conflictId: ConflictId, votes: readonly ProposalVote[]): Promise<Conflict>;
  resolveByLeaderDecision(organizationId: OrganizationId, conflictId: ConflictId, winningProposalId: DecisionProposalId, rationale: string): Promise<Conflict>;
  escalate(organizationId: OrganizationId, conflictId: ConflictId, missionId: MissionId, reason: string, requesterWorkerId: WorkerId): Promise<{ readonly conflict: Conflict; readonly escalationRequestId: EscalationRequestId }>;
}

/** Creates a real {@link ConflictResolver}. */
export function createConflictResolver(
  conflictRepository: ConflictRepository,
  proposalRepository: DecisionProposalRepository,
  escalationService: EscalationService,
  eventBus?: CollaborationEventBus,
): ConflictResolver {
  async function requireOpenConflict(organizationId: OrganizationId, conflictId: ConflictId): Promise<Conflict> {
    const conflict = await conflictRepository.findById(organizationId, conflictId);
    if (!conflict) throw new ConflictNotFoundError(conflictId);
    if (conflict.status === 'resolved') throw new ConflictAlreadyResolvedError(conflictId);
    return conflict;
  }

  async function applyOutcome(organizationId: OrganizationId, winningProposalId: DecisionProposalId, competingProposalIds: readonly DecisionProposalId[]): Promise<void> {
    for (const proposalId of competingProposalIds) {
      const proposal = await proposalRepository.findById(organizationId, proposalId);
      if (!proposal) continue;
      await proposalRepository.save({ ...proposal, status: proposalId === winningProposalId ? 'approved' : 'rejected', updatedAt: nowIso() });
    }
  }

  return {
    async resolveByVote(organizationId, conflictId, votes) {
      const conflict = await requireOpenConflict(organizationId, conflictId);
      const outcome = tallyProposalVotes(votes);
      const now = nowIso();

      if (!outcome.winningProposalId) {
        const resolving: Conflict = { ...conflict, status: 'resolving', updatedAt: now };
        await conflictRepository.save(resolving);
        return resolving;
      }

      await applyOutcome(organizationId, outcome.winningProposalId, conflict.competingProposalIds);
      const resolved: Conflict = {
        ...conflict,
        status: 'resolved',
        resolutionMethod: 'consensus',
        winningProposalId: outcome.winningProposalId,
        resolutionSummary: `Resolved by role-weighted vote (${votes.length} vote(s)).`,
        resolvedAt: now,
        updatedAt: now,
      };
      await conflictRepository.save(resolved);
      eventBus?.publish('conflict.resolved', { conflictId: resolved.id, strategy: 'consensus' });
      return resolved;
    },

    async resolveByLeaderDecision(organizationId, conflictId, winningProposalId, rationale) {
      const conflict = await requireOpenConflict(organizationId, conflictId);
      await applyOutcome(organizationId, winningProposalId, conflict.competingProposalIds);
      const now = nowIso();
      const resolved: Conflict = {
        ...conflict,
        status: 'resolved',
        resolutionMethod: 'leader_decision',
        winningProposalId,
        resolutionSummary: rationale,
        resolvedAt: now,
        updatedAt: now,
      };
      await conflictRepository.save(resolved);
      eventBus?.publish('conflict.resolved', { conflictId: resolved.id, strategy: 'leader_decision' });
      return resolved;
    },

    async escalate(organizationId, conflictId, missionId, reason, requesterWorkerId) {
      const conflict = await requireOpenConflict(organizationId, conflictId);
      const request = await escalationService.raise(organizationId, missionId, reason, 'team_lead', 'ceo_ai', requesterWorkerId);
      const now = nowIso();
      const escalated: Conflict = {
        ...conflict,
        status: 'escalated',
        resolutionMethod: 'escalation',
        resolutionSummary: reason,
        updatedAt: now,
      };
      await conflictRepository.save(escalated);
      return { conflict: escalated, escalationRequestId: request.id };
    },
  };
}
