/**
 * Real Escalation service. When an escalation targets `'ceo_ai'` and a real
 * `@lateen-os/ai-brain` `Brain` is injected, the escalation is genuinely
 * reasoned over via `brain.process()` — if Brain's reflection is confident
 * (does not flag `shouldRevise`), the escalation auto-resolves with Brain's
 * own reasoning summary; otherwise it stays open for a human/worker to
 * resolve, exactly as it would with no Brain injected at all.
 *
 * @module escalation/service.impl
 */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { Brain } from '@lateen-os/ai-brain';
import { NotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { EscalationDecisionRepository, EscalationRequestRepository } from './repository.js';
import type { EscalationDecision, EscalationLevel, EscalationRequest, EscalationRequestId } from './types.js';

export interface EscalationServiceDeps {
  readonly requestRepository: EscalationRequestRepository;
  readonly decisionRepository: EscalationDecisionRepository;
  /** Real ai-brain collaborator — consulted only for escalations targeting 'ceo_ai'. */
  readonly brain?: Pick<Brain, 'process'>;
}

export interface EscalationService {
  raise(organizationId: OrganizationId, missionId: MissionId, reason: string, currentLevel: EscalationLevel, targetLevel: EscalationLevel, requesterWorkerId: WorkerId): Promise<EscalationRequest>;
  resolve(organizationId: OrganizationId, escalationRequestId: EscalationRequestId, level: EscalationLevel, resolution: string, resolverWorkerId?: WorkerId): Promise<EscalationRequest>;
}

/** Creates a real {@link EscalationService}. */
export function createEscalationService(deps: EscalationServiceDeps): EscalationService {
  async function requireRequest(organizationId: OrganizationId, escalationRequestId: EscalationRequestId): Promise<EscalationRequest> {
    const request = await deps.requestRepository.findById(organizationId, escalationRequestId);
    if (!request) throw new NotFoundError('EscalationRequest', escalationRequestId);
    return request;
  }

  async function recordDecision(
    organizationId: OrganizationId,
    escalationRequestId: EscalationRequestId,
    level: EscalationLevel,
    resolution: string,
    resolverWorkerId?: WorkerId,
  ): Promise<EscalationDecision> {
    const now = nowIso();
    const decision: EscalationDecision = {
      id: generateId('escalation-decision'),
      organizationId,
      createdAt: now,
      updatedAt: now,
      escalationRequestId,
      level,
      resolverWorkerId,
      resolution,
      resolvedAt: now,
    };
    await deps.decisionRepository.save(decision);
    return decision;
  }

  return {
    async raise(organizationId, missionId, reason, currentLevel, targetLevel, requesterWorkerId) {
      const now = nowIso();
      let request: EscalationRequest = {
        id: generateId('escalation-request'),
        organizationId,
        createdAt: now,
        updatedAt: now,
        missionId,
        reason,
        currentLevel,
        targetLevel,
        requesterWorkerId,
        status: 'open',
      };
      await deps.requestRepository.save(request);

      if (targetLevel === 'ceo_ai' && deps.brain) {
        const response = await deps.brain.process({
          organizationId,
          sessionId: request.id,
          correlationId: request.id,
          rawInput: reason,
          actorId: requesterWorkerId,
        });

        if (!response.reflection.shouldRevise) {
          const decision = await recordDecision(
            organizationId,
            request.id,
            'ceo_ai',
            response.reasoning.explanation.summary,
          );
          request = { ...request, status: 'resolved', decision, updatedAt: nowIso() };
          await deps.requestRepository.save(request);
        } else {
          request = { ...request, status: 'acknowledged', updatedAt: nowIso() };
          await deps.requestRepository.save(request);
        }
      }

      return request;
    },

    async resolve(organizationId, escalationRequestId, level, resolution, resolverWorkerId) {
      const request = await requireRequest(organizationId, escalationRequestId);
      const decision = await recordDecision(organizationId, escalationRequestId, level, resolution, resolverWorkerId);
      const updated: EscalationRequest = { ...request, status: 'resolved', decision, updatedAt: nowIso() };
      await deps.requestRepository.save(updated);
      return updated;
    },
  };
}
