import { describe, expect, it } from 'vitest';
import { createDecisionQueries } from '../src/queries/decision-queries.impl.js';
import { createDecisionRepository } from '../src/decision/repository.impl.js';
import { createRecommendationRepository } from '../src/recommendation/repository.impl.js';
import { createApprovalFlowRepository } from '../src/approval/repository.impl.js';
import { createRiskAssessmentRepository } from '../src/risk/repository.impl.js';
import type { Decision } from '../src/decision/types.js';
import type { Recommendation } from '../src/recommendation/types.js';
import type { ApprovalFlow } from '../src/approval/types.js';
import type { RiskAssessment } from '../src/risk/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

function buildQueries(options: {
  decisions?: readonly Decision[];
  recommendations?: readonly Recommendation[];
  approvalFlows?: readonly ApprovalFlow[];
  riskAssessments?: readonly RiskAssessment[];
} = {}) {
  return createDecisionQueries({
    decisionRepository: createDecisionRepository(options.decisions),
    recommendationRepository: createRecommendationRepository(options.recommendations),
    approvalFlowRepository: createApprovalFlowRepository(options.approvalFlows),
    riskAssessmentRepository: createRiskAssessmentRepository(options.riskAssessments),
  });
}

const baseDecision: Decision = {
  id: 'd1',
  organizationId: ORG,
  createdAt: now,
  updatedAt: now,
  title: 'Test',
  description: 'desc',
  category: 'approval',
  status: 'evaluating',
  requestedBy: { type: 'agent' },
  requestedAt: now,
  confidence: '0.8',
  risk: 'low',
  priority: 'normal',
};

describe('createDecisionQueries', () => {
  it('findDecision returns the decision when it exists', async () => {
    const queries = buildQueries({ decisions: [baseDecision] });
    await expect(queries.findDecision(ORG, 'd1')).resolves.toEqual(baseDecision);
  });

  it('findRecommendations returns every recommendation for the decision', async () => {
    const recommendation: Recommendation = {
      id: 'r1',
      organizationId: ORG,
      createdAt: now,
      updatedAt: now,
      decisionId: 'd1',
      title: 'Rec',
      summary: 's',
      proposedAction: 'a',
      score: { value: '0.8', confidence: '0.7' },
      alternatives: [{ code: 'alt1', title: 'Alt 1' }],
      status: 'proposed',
    };
    const queries = buildQueries({ decisions: [baseDecision], recommendations: [recommendation] });
    await expect(queries.findRecommendations(ORG, 'd1')).resolves.toEqual([recommendation]);
  });

  it('findPendingApprovals merges pending and in_progress flows', async () => {
    const pending: ApprovalFlow = { id: 'a1', organizationId: ORG, createdAt: now, updatedAt: now, decisionId: 'd1', steps: [], status: 'pending' };
    const inProgress: ApprovalFlow = { id: 'a2', organizationId: ORG, createdAt: now, updatedAt: now, decisionId: 'd1', steps: [], status: 'in_progress' };
    const approved: ApprovalFlow = { id: 'a3', organizationId: ORG, createdAt: now, updatedAt: now, decisionId: 'd1', steps: [], status: 'approved' };
    const queries = buildQueries({ approvalFlows: [pending, inProgress, approved] });

    const result = await queries.findPendingApprovals({ organizationId: ORG });
    expect(result.flows).toHaveLength(2);
  });

  it('findRisks with a decisionId resolves via the decision\'s riskAssessmentId', async () => {
    const risk: RiskAssessment = { id: 'ra1', organizationId: ORG, createdAt: now, updatedAt: now, overallLevel: 'high', factors: [] };
    const decision: Decision = { ...baseDecision, riskAssessmentId: 'ra1' };
    const queries = buildQueries({ decisions: [decision], riskAssessments: [risk] });

    const result = await queries.findRisks(ORG, 'd1');
    expect(result.assessments).toEqual([risk]);
  });

  it('findRisks with no decisionId returns assessments across all levels', async () => {
    const risks: RiskAssessment[] = [
      { id: 'ra1', organizationId: ORG, createdAt: now, updatedAt: now, overallLevel: 'high', factors: [] },
      { id: 'ra2', organizationId: ORG, createdAt: now, updatedAt: now, overallLevel: 'low', factors: [] },
    ];
    const queries = buildQueries({ riskAssessments: risks });

    const result = await queries.findRisks(ORG);
    expect(result.assessments).toHaveLength(2);
  });

  it('findPolicyViolations returns empty when no lookup is injected', async () => {
    const queries = buildQueries();
    const result = await queries.findPolicyViolations(ORG, 'd1');
    expect(result.violations).toEqual([]);
    expect(result.decisionId).toBe('d1');
  });

  it('findAlternativeDecisions collects alternatives across recommendations', async () => {
    const recommendation: Recommendation = {
      id: 'r1',
      organizationId: ORG,
      createdAt: now,
      updatedAt: now,
      decisionId: 'd1',
      title: 'Rec',
      summary: 's',
      proposedAction: 'a',
      score: { value: '0.8', confidence: '0.7' },
      alternatives: [{ code: 'alt1', title: 'Alt 1' }, { code: 'alt2', title: 'Alt 2' }],
      status: 'proposed',
    };
    const queries = buildQueries({ decisions: [baseDecision], recommendations: [recommendation] });

    const result = await queries.findAlternativeDecisions(ORG, 'd1');
    expect(result.decision).toEqual(baseDecision);
    expect(result.alternatives).toHaveLength(2);
  });

  it('findAlternativeDecisions throws for an unknown decision', async () => {
    const queries = buildQueries();
    await expect(queries.findAlternativeDecisions(ORG, 'missing')).rejects.toThrow(/not found/);
  });
});
