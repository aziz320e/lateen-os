import { randomUUID } from 'node:crypto';
import type { Decision, Recommendation } from '@lateen-os/decision-engine';
import type { DecisionSubmission } from '../../domain/decision-submission.js';
import type { DecisionId, OrganizationId } from '../../domain/identifiers.js';
import type { DecisionEnginePort } from '../../ports/outbound/decision-engine-port.js';
import type { CacheStore } from '../cache/redis-cache.js';
import type { DiscoveryEventPublisher } from '../../domain/ports.js';

/**
 * Platform Decision Engine adapter.
 * Flow: RecommendationCandidate → DecisionRequest (DecisionSubmission) → DecisionReference (Decision)
 * Persists via Redis; uses @lateen-os/decision-engine domain types.
 */
export function createDecisionEngineAdapter(
  cache: CacheStore,
  events: DiscoveryEventPublisher,
): DecisionEnginePort {
  const decisionKey = (organizationId: OrganizationId, decisionId: DecisionId) =>
    `decision:${organizationId}:${decisionId as string}`;

  return {
    async submitForDecision(organizationId: OrganizationId, submission: DecisionSubmission) {
      const now = new Date().toISOString();
      const decision: Decision = {
        id: submission.decisionId,
        organizationId,
        title: submission.title,
        description: submission.summary,
        category: submission.decisionCategory,
        status: 'submitted',
        requestedBy: { type: 'ai_agent' },
        requestedAt: now,
        confidence: '82',
        risk: 'low',
        priority: 'normal',
        createdAt: now,
        updatedAt: now,
      };

      const recommendation: Recommendation = {
        id: randomUUID() as Recommendation['id'],
        organizationId,
        decisionId: submission.decisionId,
        title: submission.title,
        summary: submission.summary,
        proposedAction: submission.proposedAction,
        score: { value: '0.82', confidence: '82', rationale: 'Platform decision engine evaluation' },
        alternatives: [],
        status: 'proposed',
        createdAt: now,
        updatedAt: now,
      };

      await cache.set(decisionKey(organizationId, submission.decisionId), { decision, recommendations: [recommendation] });

      await events.publish({
        eventName: 'DecisionRequested',
        eventId: randomUUID(),
        occurredAt: now,
        aggregateId: submission.decisionId as string,
        payload: {
          organizationId: organizationId as string,
          decisionId: submission.decisionId as string,
          recommendationCandidateId: submission.recommendationCandidateId as string,
        },
      });

      return decision;
    },

    async getRecommendation(organizationId: OrganizationId, decisionId: DecisionId) {
      const stored = await cache.get<{ recommendations: Recommendation[] }>(
        decisionKey(organizationId, decisionId),
      );
      return stored?.recommendations ?? [];
    },

    async findDecision(organizationId: OrganizationId, decisionId: DecisionId) {
      const stored = await cache.get<{ decision: Decision }>(decisionKey(organizationId, decisionId));
      return stored?.decision ?? null;
    },

    async findRecommendations(organizationId: OrganizationId, decisionId: DecisionId) {
      return this.getRecommendation(organizationId, decisionId);
    },

    async findPendingApprovals() {
      return { flows: [] };
    },

    async findRisks() {
      return { assessments: [] };
    },

    async findPolicyViolations() {
      return { violations: [] };
    },

    async findAlternativeDecisions(organizationId: OrganizationId, decisionId: DecisionId) {
      const decision = await this.findDecision(organizationId, decisionId);
      if (!decision) throw new Error('Decision not found');
      return { decision, alternatives: [] };
    },
  } as DecisionEnginePort;
}
