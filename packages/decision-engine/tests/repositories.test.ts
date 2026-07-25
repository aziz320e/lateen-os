import { describe, expect, it } from 'vitest';
import { createDecisionRepository } from '../src/decision/repository.impl.js';
import { createDecisionContextRepository } from '../src/context/repository.impl.js';
import { createEvaluationResultRepository } from '../src/evaluation/repository.impl.js';
import { createDecisionPolicyRepository } from '../src/policy/repository.impl.js';
import { createDecisionRuleRepository } from '../src/rule/repository.impl.js';
import { createRecommendationRepository } from '../src/recommendation/repository.impl.js';
import { createApprovalFlowRepository } from '../src/approval/repository.impl.js';
import { createRiskAssessmentRepository } from '../src/risk/repository.impl.js';
import { createPriorityScoreRepository } from '../src/priority/repository.impl.js';
import { createDecisionExecutionPlanRepository } from '../src/execution/repository.impl.js';
import type { Decision } from '../src/decision/types.js';
import type { DecisionContext } from '../src/context/types.js';
import type { EvaluationResult } from '../src/evaluation/types.js';
import type { DecisionPolicy } from '../src/policy/types.js';
import type { DecisionRule } from '../src/rule/types.js';
import type { Recommendation } from '../src/recommendation/types.js';
import type { ApprovalFlow } from '../src/approval/types.js';
import type { RiskAssessment } from '../src/risk/types.js';
import type { PriorityScore } from '../src/priority/types.js';
import type { DecisionExecutionPlan } from '../src/execution/types.js';

const ORG = 'org-1';
const now = new Date().toISOString();

describe('createDecisionRepository', () => {
  const decision: Decision = {
    id: 'd1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    title: 'Approve budget',
    description: 'desc',
    category: 'approval',
    status: 'draft',
    requestedBy: { type: 'agent' },
    requestedAt: now,
    confidence: '0.8',
    risk: 'low',
    priority: 'normal',
  };

  it('saves and finds by id', async () => {
    const repo = createDecisionRepository();
    await repo.save(decision);
    await expect(repo.findById(ORG, 'd1')).resolves.toEqual(decision);
  });

  it('findByCategory and findByStatus filter correctly', async () => {
    const repo = createDecisionRepository([decision]);
    await expect(repo.findByCategory(ORG, 'approval')).resolves.toHaveLength(1);
    await expect(repo.findByCategory(ORG, 'rejection')).resolves.toHaveLength(0);
    await expect(repo.findByStatus(ORG, 'draft')).resolves.toHaveLength(1);
  });
});

describe('createDecisionContextRepository', () => {
  const context: DecisionContext = {
    id: 'c1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    businessDnaRefs: [],
    capabilityRefs: [],
    currentMetrics: [],
    currentPolicies: [],
  };

  it('findByDecision returns the matching context', async () => {
    const repo = createDecisionContextRepository([context]);
    await expect(repo.findByDecision(ORG, 'd1')).resolves.toEqual(context);
    await expect(repo.findByDecision(ORG, 'd2')).resolves.toBeNull();
  });
});

describe('createEvaluationResultRepository', () => {
  const result: EvaluationResult = {
    id: 'e1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    criteria: [],
    scores: [],
    overallScore: '0.7',
    confidence: '0.8',
    passed: true,
  };

  it('findByDecision returns every result for that decision', async () => {
    const repo = createEvaluationResultRepository([result]);
    await expect(repo.findByDecision(ORG, 'd1')).resolves.toHaveLength(1);
    await expect(repo.findByDecision(ORG, 'other')).resolves.toHaveLength(0);
  });
});

describe('createDecisionPolicyRepository', () => {
  const policy: DecisionPolicy = {
    id: 'p1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    code: 'POL-1',
    name: 'Test Policy',
    scope: { organizationWide: true },
    constraints: [],
    status: 'active',
  };

  it('findByCode and findByStatus work', async () => {
    const repo = createDecisionPolicyRepository([policy]);
    await expect(repo.findByCode(ORG, 'POL-1')).resolves.toEqual(policy);
    await expect(repo.findByCode(ORG, 'MISSING')).resolves.toBeNull();
    await expect(repo.findByStatus(ORG, 'active')).resolves.toHaveLength(1);
  });
});

describe('createDecisionRuleRepository', () => {
  const rule: DecisionRule = {
    id: 'r1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    code: 'RULE-1',
    name: 'Test Rule',
    kind: 'business',
    status: 'active',
    priority: 1,
  };

  it('findByCode, findByKind, findByStatus work', async () => {
    const repo = createDecisionRuleRepository([rule]);
    await expect(repo.findByCode(ORG, 'RULE-1')).resolves.toEqual(rule);
    await expect(repo.findByKind(ORG, 'business')).resolves.toHaveLength(1);
    await expect(repo.findByKind(ORG, 'technical')).resolves.toHaveLength(0);
    await expect(repo.findByStatus(ORG, 'active')).resolves.toHaveLength(1);
  });
});

describe('createRecommendationRepository', () => {
  const recommendation: Recommendation = {
    id: 'rec1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    title: 'Do X',
    summary: 'summary',
    proposedAction: 'do_x',
    score: { value: '0.9', confidence: '0.8' },
    alternatives: [],
    status: 'proposed',
  };

  it('findByDecision and findByStatus work', async () => {
    const repo = createRecommendationRepository([recommendation]);
    await expect(repo.findByDecision(ORG, 'd1')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'proposed')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'rejected')).resolves.toHaveLength(0);
  });
});

describe('createApprovalFlowRepository', () => {
  const flow: ApprovalFlow = {
    id: 'af1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    steps: [],
    status: 'pending',
  };

  it('findByDecision and findByStatus work', async () => {
    const repo = createApprovalFlowRepository([flow]);
    await expect(repo.findByDecision(ORG, 'd1')).resolves.toEqual(flow);
    await expect(repo.findByStatus(ORG, 'pending')).resolves.toHaveLength(1);
  });
});

describe('createRiskAssessmentRepository', () => {
  const assessment: RiskAssessment = {
    id: 'ra1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    overallLevel: 'high',
    factors: [],
  };

  it('findByLevel filters correctly', async () => {
    const repo = createRiskAssessmentRepository([assessment]);
    await expect(repo.findByLevel(ORG, 'high')).resolves.toHaveLength(1);
    await expect(repo.findByLevel(ORG, 'low')).resolves.toHaveLength(0);
  });
});

describe('createPriorityScoreRepository', () => {
  const score: PriorityScore = {
    id: 'ps1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    level: 'urgent',
    score: '0.95',
    strategy: 'impact_first',
  };

  it('findByLevel filters correctly', async () => {
    const repo = createPriorityScoreRepository([score]);
    await expect(repo.findByLevel(ORG, 'urgent')).resolves.toHaveLength(1);
    await expect(repo.findByLevel(ORG, 'low')).resolves.toHaveLength(0);
  });
});

describe('createDecisionExecutionPlanRepository', () => {
  const plan: DecisionExecutionPlan = {
    id: 'ep1',
    organizationId: ORG,
    createdAt: now,
    updatedAt: now,
    decisionId: 'd1',
    steps: [],
    status: 'ready',
  };

  it('findByDecision and findByStatus work', async () => {
    const repo = createDecisionExecutionPlanRepository([plan]);
    await expect(repo.findByDecision(ORG, 'd1')).resolves.toEqual(plan);
    await expect(repo.findByStatus(ORG, 'ready')).resolves.toHaveLength(1);
    await expect(repo.findByStatus(ORG, 'failed')).resolves.toHaveLength(0);
  });
});
