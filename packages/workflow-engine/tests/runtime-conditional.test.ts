import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '../src/runtime.js';
import { createExpressionRepository, createPolicyConditionRepository } from '../src/condition/repository.impl.js';
import { createConditionEvaluator } from '../src/condition/evaluator.impl.js';
import type { StepHandler } from '../src/execution/step-handler.js';
import type { ServiceTask } from '../src/step/types.js';
import type { ConditionalTransition, Transition } from '../src/transition/types.js';

const ORG = 'org-1';
const NOW = '2026-01-01T00:00:00.000Z';

function serviceStep(stepId: string, code: string): ServiceTask {
  return { stepId, code, name: code, type: 'service', optional: false, serviceRef: 'svc://noop', operation: 'noop', inputVariableKeys: [] };
}

async function setup() {
  const expressionRepository = createExpressionRepository();
  const policyConditionRepository = createPolicyConditionRepository();
  await expressionRepository.save({
    id: 'expr-high-value',
    organizationId: ORG,
    createdAt: NOW,
    updatedAt: NOW,
    language: 'simple',
    source: 'amount > 1000',
  });
  await policyConditionRepository.save({
    id: 'cond-high-value',
    organizationId: ORG,
    createdAt: NOW,
    updatedAt: NOW,
    policyCode: 'high-value-expense',
    policyName: 'High-value expense requires manual approval',
    expressionId: 'expr-high-value',
    failOnViolation: false,
  });

  const taken: string[] = [];
  const handler: StepHandler = async (step) => {
    taken.push(step.code);
    return { success: true };
  };

  const runtime = createWorkflowRuntime({
    expressionRepository,
    policyConditionRepository,
    conditionEvaluator: createConditionEvaluator(),
    stepHandlers: { service: handler },
  });

  const { definition } = await runtime.defineWorkflow({
    organizationId: ORG,
    code: 'expense-approval',
    name: 'Expense Approval',
    metadata: { category: 'approval' },
    version: '1.0.0',
    steps: [serviceStep('submit', 'submit'), serviceStep('auto-approve', 'autoApprove'), serviceStep('manual-approve', 'manualApprove')],
    transitions: [
      {
        transitionId: 't-cond',
        fromStepId: 'submit',
        toStepId: 'manual-approve',
        type: 'conditional',
        conditionId: 'cond-high-value',
        priority: 1,
      } satisfies ConditionalTransition,
      { transitionId: 't-default', fromStepId: 'submit', toStepId: 'auto-approve', type: 'default' } satisfies Transition,
    ],
  });

  return { runtime, definition, taken };
}

describe('WorkflowRuntime — conditional branching', () => {
  it('routes to the conditional branch when the expression matches', async () => {
    const { runtime, definition, taken } = await setup();
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id, variables: { amount: 5000 } });

    expect(taken).toEqual(['submit', 'manualApprove']);
    expect(instance.status).toBe('completed');
  });

  it('falls back to the default branch when the expression does not match', async () => {
    const { runtime, definition, taken } = await setup();
    const instance = await runtime.startWorkflow({ organizationId: ORG, definitionId: definition.id, variables: { amount: 50 } });

    expect(taken).toEqual(['submit', 'autoApprove']);
    expect(instance.status).toBe('completed');
  });
});
