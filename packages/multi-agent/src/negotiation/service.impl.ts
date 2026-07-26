/**
 * Real Negotiation service — opens a negotiation over a topic, records
 * rounds, and closes it with an outcome.
 *
 * @module negotiation/service.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { NegotiationRepository, NegotiationRoundRepository } from './repository.js';
import type { Negotiation, NegotiationId, NegotiationOutcome, NegotiationOutcomeType } from './types.js';

export interface NegotiationService {
  open(organizationId: OrganizationId, missionId: MissionId, topic: string, participantWorkerIds: readonly WorkerId[]): Promise<Negotiation>;
  addRound(organizationId: OrganizationId, negotiationId: NegotiationId, proposalSummary: string, participantWorkerIds: readonly WorkerId[]): Promise<Negotiation>;
  close(organizationId: OrganizationId, negotiationId: NegotiationId, type: NegotiationOutcomeType, summary: string, agreementScore?: string): Promise<Negotiation>;
}

/** Creates a real {@link NegotiationService}. */
export function createNegotiationService(
  negotiationRepository: NegotiationRepository,
  roundRepository: NegotiationRoundRepository,
): NegotiationService {
  async function requireNegotiation(organizationId: OrganizationId, negotiationId: NegotiationId): Promise<Negotiation> {
    const negotiation = await negotiationRepository.findById(organizationId, negotiationId);
    if (!negotiation) throw new NotFoundError('Negotiation', negotiationId);
    return negotiation;
  }

  return {
    async open(organizationId, missionId, topic, participantWorkerIds) {
      const now = nowIso();
      const negotiation: Negotiation = {
        id: generateId('negotiation'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        topic,
        status: 'open',
        participantWorkerIds,
        roundIds: [],
      };
      await negotiationRepository.save(negotiation);
      return negotiation;
    },

    async addRound(organizationId, negotiationId, proposalSummary, participantWorkerIds) {
      const negotiation = await requireNegotiation(organizationId, negotiationId);
      const now = nowIso();
      const round = {
        id: generateId('negotiation-round'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        negotiationId,
        roundNumber: negotiation.roundIds.length + 1,
        proposalSummary,
        participantWorkerIds,
        openedAt: now,
      };
      await roundRepository.save(round);
      const updated: Negotiation = {
        ...negotiation,
        status: 'in_progress',
        roundIds: [...negotiation.roundIds, round.id],
        updatedAt: now,
      };
      await negotiationRepository.save(updated);
      return updated;
    },

    async close(organizationId, negotiationId, type, summary, agreementScore) {
      const negotiation = await requireNegotiation(organizationId, negotiationId);
      const now = nowIso();
      const outcome: NegotiationOutcome = { negotiationId, type, summary, agreementScore, resolvedAt: now };
      const updated: Negotiation = {
        ...negotiation,
        status: type === 'deadlock' ? 'deadlocked' : 'agreed',
        outcome,
        updatedAt: now,
      };
      await negotiationRepository.save(updated);
      return updated;
    },
  };
}
