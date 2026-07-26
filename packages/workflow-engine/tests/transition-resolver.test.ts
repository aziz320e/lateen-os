import { describe, expect, it } from 'vitest';
import { createConditionEvaluator } from '../src/condition/evaluator.impl.js';
import { createExpressionRepository, createPolicyConditionRepository } from '../src/condition/repository.impl.js';
import { NoOutgoingTransitionError } from '../src/shared/errors.js';
import { resolveNextSteps } from '../src/execution/transition-resolver.js';
import type { ConditionalTransition, ParallelTransition, Transition } from '../src/transition/types.js';

const ORG = 'org-1';
const NOW = '2026-01-01T00:00:00.000Z';

async function makeDeps() {
  const expressionRepository = createExpressionRepository();
  const policyConditionRepository = createPolicyConditionRepository();
  await expressionRepository.save({ id: 'expr-high', organizationId: ORG, createdAt: NOW, updatedAt: NOW, language: 'simple', source: 'amount > 1000' });
  await policyConditionRepository.save({
    id: 'cond-high',
    organizationId: ORG,
    createdAt: NOW,
    updatedAt: NOW,
    policyCode: 'high-value',
    policyName: 'High value',
    expressionId: 'expr-high',
    failOnViolation: false,
  });
  return { conditionEvaluator: createConditionEvaluator(), expressionRepository, policyConditionRepository };
}

describe('resolveNextSteps', () => {
  it('returns "none" for a terminal step', async () => {
    const deps = await makeDeps();
    const resolution = await resolveNextSteps(ORG, 'step-1', [], {}, deps);
    expect(resolution).toEqual({ kind: 'none' });
  });

  it('resolves a single sequential transition', async () => {
    const deps = await makeDeps();
    const transitions: Transition[] = [{ transitionId: 't1', fromStepId: 'step-1', toStepId: 'step-2', type: 'sequential' }];
    const resolution = await resolveNextSteps(ORG, 'step-1', transitions, {}, deps);
    expect(resolution).toEqual({ kind: 'single', stepId: 'step-2' });
  });

  it('takes the matching conditional branch', async () => {
    const deps = await makeDeps();
    const conditional: ConditionalTransition = {
      transitionId: 't1',
      fromStepId: 'step-1',
      toStepId: 'step-approval',
      type: 'conditional',
      conditionId: 'cond-high',
      priority: 1,
    };
    const resolution = await resolveNextSteps(ORG, 'step-1', [conditional], { amount: 5000 }, deps);
    expect(resolution).toEqual({ kind: 'single', stepId: 'step-approval' });
  });

  it('falls back to a sequential/default transition when no conditional matches', async () => {
    const deps = await makeDeps();
    const conditional: ConditionalTransition = {
      transitionId: 't1',
      fromStepId: 'step-1',
      toStepId: 'step-approval',
      type: 'conditional',
      conditionId: 'cond-high',
      priority: 1,
    };
    const fallback: Transition = { transitionId: 't2', fromStepId: 'step-1', toStepId: 'step-auto', type: 'default' };
    const resolution = await resolveNextSteps(ORG, 'step-1', [conditional, fallback], { amount: 100 }, deps);
    expect(resolution).toEqual({ kind: 'single', stepId: 'step-auto' });
  });

  it('throws NoOutgoingTransitionError when no conditional matches and there is no fallback', async () => {
    const deps = await makeDeps();
    const conditional: ConditionalTransition = {
      transitionId: 't1',
      fromStepId: 'step-1',
      toStepId: 'step-approval',
      type: 'conditional',
      conditionId: 'cond-high',
      priority: 1,
    };
    await expect(resolveNextSteps(ORG, 'step-1', [conditional], { amount: 100 }, deps)).rejects.toBeInstanceOf(NoOutgoingTransitionError);
  });

  it('resolves a parallel fork', async () => {
    const deps = await makeDeps();
    const fork: ParallelTransition = {
      transitionId: 't1',
      fromStepId: 'step-1',
      toStepId: 'step-join',
      type: 'parallel',
      fork: true,
      branchStepIds: ['branch-a', 'branch-b'],
      joinRequiredCount: 2,
    };
    const resolution = await resolveNextSteps(ORG, 'step-1', [fork], {}, deps);
    expect(resolution).toEqual({ kind: 'fork', branchStepIds: ['branch-a', 'branch-b'], joinStepId: 'step-join', joinRequiredCount: 2 });
  });

  it('defaults joinRequiredCount to the branch count when unspecified', async () => {
    const deps = await makeDeps();
    const fork: ParallelTransition = {
      transitionId: 't1',
      fromStepId: 'step-1',
      toStepId: 'step-join',
      type: 'parallel',
      fork: true,
      branchStepIds: ['branch-a', 'branch-b', 'branch-c'],
    };
    const resolution = await resolveNextSteps(ORG, 'step-1', [fork], {}, deps);
    expect(resolution.kind).toBe('fork');
    expect(resolution.kind === 'fork' && resolution.joinRequiredCount).toBe(3);
  });
});
