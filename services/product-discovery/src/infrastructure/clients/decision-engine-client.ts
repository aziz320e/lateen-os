import { randomUUID } from 'node:crypto';
import type { Decision, Recommendation } from '@lateen-os/decision-engine';
import type { DecisionSubmission } from '../../domain/decision-submission.js';
import type { DecisionId, OrganizationId } from '../../domain/identifiers.js';
import type { DecisionEnginePort } from '../../ports/outbound/decision-engine-port.js';

export function createInMemoryDecisionEngineClient(): DecisionEnginePort {
  const decisions = new Map<string, Decision>();
  const recommendations = new Map<string, Recommendation[]>();

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

      decisions.set(`${organizationId}:${submission.decisionId as string}`, decision);
      recommendations.set(`${organizationId}:${submission.decisionId as string}`, [
        {
          id: randomUUID() as Recommendation['id'],
          organizationId,
          decisionId: submission.decisionId,
          title: submission.title,
          summary: submission.summary,
          proposedAction: submission.proposedAction,
          score: { value: '0.82', confidence: '82', rationale: 'Mock decision engine score' },
          alternatives: [],
          status: 'proposed',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      return decision;
    },
    async getRecommendation(organizationId: OrganizationId, decisionId: DecisionId) {
      return recommendations.get(`${organizationId}:${decisionId as string}`) ?? [];
    },
    async findDecision(organizationId: OrganizationId, decisionId: DecisionId) {
      return decisions.get(`${organizationId}:${decisionId as string}`) ?? null;
    },
    async findRecommendations(organizationId: OrganizationId, decisionId: DecisionId) {
      return recommendations.get(`${organizationId}:${decisionId as string}`) ?? [];
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
      const decision = decisions.get(`${organizationId}:${decisionId as string}`);
      if (!decision) throw new Error('Decision not found');
      return { decision, alternatives: [] };
    },
  } as DecisionEnginePort;
}
