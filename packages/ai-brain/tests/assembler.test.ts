import { describe, expect, it } from 'vitest';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import { createEnterpriseContextAssembler } from '../src/context/assembler.impl.js';
import { createIntentRecognizer } from '../src/intent/recognizer.impl.js';

const ORG = 'org-1';
const SESSION = 'session-1';
const CORRELATION = 'corr-1';

function makeDecisionQueries(overrides: Partial<DecisionQueries> = {}): DecisionQueries {
  return {
    findDecision: async () => null,
    findRecommendations: async () => [],
    findPendingApprovals: async () => ({ flows: [] }),
    findRisks: async () => ({ assessments: [] }),
    findPolicyViolations: async () => ({ violations: [] }),
    findAlternativeDecisions: async () => {
      throw new Error('not implemented in fake');
    },
    ...overrides,
  };
}

describe('createEnterpriseContextAssembler', () => {
  it('builds business context from intent entities', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Create "Winter Banner"' });
    const assembler = createEnterpriseContextAssembler();

    const context = await assembler.assemble({ organizationId: ORG, sessionId: SESSION, correlationId: CORRELATION, intent });
    expect(context.business.entityReferences).toEqual(['Winter Banner']);
    expect(context.organizationId).toBe(ORG);
  });

  it('builds conversation context including recent history and the current input', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'What is the status?' });
    const assembler = createEnterpriseContextAssembler();

    const context = await assembler.assemble({
      organizationId: ORG,
      sessionId: SESSION,
      correlationId: CORRELATION,
      intent,
      conversationHistory: ['hello', 'how can I help?'],
    });
    expect(context.conversation.turnCount).toBe(3);
    expect(context.conversation.recentMessages).toEqual(['hello', 'how can I help?', 'What is the status?']);
  });

  it('omits mission context for non-mission-like intents', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Create a report' });
    const assembler = createEnterpriseContextAssembler();

    const context = await assembler.assemble({ organizationId: ORG, sessionId: SESSION, correlationId: CORRELATION, intent });
    expect(context.mission).toBeUndefined();
  });

  it('populates mission context with pending decision approvals for mission-like intents', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Start a mission to expand sales' });

    const decisionQueries = makeDecisionQueries({
      findPendingApprovals: async () => ({
        flows: [
          {
            id: 'flow-1',
            organizationId: ORG,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            decisionId: 'decision-1',
            steps: [],
            status: 'pending',
          },
        ],
      }),
    });
    const assembler = createEnterpriseContextAssembler({ decisionQueries });

    const context = await assembler.assemble({ organizationId: ORG, sessionId: SESSION, correlationId: CORRELATION, intent });
    expect(context.mission?.relatedDecisionIds).toEqual(['decision-1']);
  });

  it('leaves related decisions empty for mission-like intents when no decisionQueries is injected', async () => {
    const recognizer = createIntentRecognizer();
    const intent = await recognizer.recognize({ organizationId: ORG, sessionId: SESSION, rawInput: 'Coordinate a mission' });
    const assembler = createEnterpriseContextAssembler();

    const context = await assembler.assemble({ organizationId: ORG, sessionId: SESSION, correlationId: CORRELATION, intent });
    expect(context.mission?.relatedDecisionIds).toEqual([]);
  });
});
