/**
 * Shared, deterministic fixture builders for the integration suite.
 * `@lateen-os/sdk`'s DecisionEngine facade exposes `reasoner` + a
 * read-only `queries` layer (no repository write path — by design, see
 * Commit 9's "do not expose internal repositories"), so exercising the
 * reasoner directly requires hand-built `Decision`/`DecisionContext`/
 * `Recommendation` fixtures rather than seeding through the facade.
 *
 * Types are derived structurally from `DecisionEngine['reasoner']['reason']`
 * (sdk's own exported facade type) instead of depending on
 * `@lateen-os/decision-engine` directly, so this suite composes only
 * through the sdk's public surface, per its own package scope.
 */
import type { DecisionEngine } from '@lateen-os/sdk';

type ReasoningInput = Parameters<DecisionEngine['reasoner']['reason']>[0];
type Decision = ReasoningInput['decision'];
type DecisionContext = ReasoningInput['context'];
type Recommendation = ReasoningInput['recommendations'][number];

let counter = 0;

/** Deterministic-enough id for test fixtures — not used for anything cryptographic. */
export function testId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

const NOW = '2026-01-01T00:00:00.000Z';

export function buildDecision(organizationId: string, overrides: Partial<Decision> = {}): Decision {
  return {
    id: testId('decision'),
    organizationId,
    createdAt: NOW,
    updatedAt: NOW,
    title: 'Approve market expansion budget',
    description: 'Allocate budget to expand into a new market segment.',
    category: 'strategic',
    status: 'evaluating',
    requestedBy: { type: 'ai_agent' },
    requestedAt: NOW,
    confidence: '0.75',
    risk: 'low',
    priority: 'high',
    ...overrides,
  };
}

export function buildDecisionContext(
  organizationId: string,
  decisionId: string,
  overrides: Partial<DecisionContext> = {},
): DecisionContext {
  return {
    id: testId('decision-context'),
    organizationId,
    createdAt: NOW,
    updatedAt: NOW,
    decisionId,
    businessDnaRefs: [],
    capabilityRefs: [],
    currentMetrics: [],
    currentPolicies: [],
    ...overrides,
  };
}

export function buildRecommendation(
  organizationId: string,
  decisionId: string,
  scoreValue: string,
  confidence: string,
  overrides: Partial<Recommendation> = {},
): Recommendation {
  return {
    id: testId('recommendation'),
    organizationId,
    createdAt: NOW,
    updatedAt: NOW,
    decisionId,
    title: 'Proceed with expansion',
    summary: 'Market analysis supports expansion.',
    proposedAction: 'approve_budget',
    score: { value: scoreValue, confidence },
    alternatives: [],
    status: 'proposed',
    ...overrides,
  };
}
