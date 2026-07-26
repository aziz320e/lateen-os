/**
 * Real transition resolution — decides what happens after a step
 * completes: a single sequential/conditional next step, a parallel fork,
 * or nothing (a terminal step).
 *
 * @module execution/transition-resolver
 */
import type { ConditionEvaluator } from '../condition/evaluator.js';
import type { PolicyConditionRepository, ExpressionRepository } from '../condition/repository.js';
import { ConditionEvaluationError, NoOutgoingTransitionError } from '../shared/errors.js';
import type { OrganizationId, WorkflowStepId } from '../shared/identifiers.js';
import type { ConditionalTransition, ParallelTransition, Transition } from '../transition/types.js';

export type NextStepsResolution =
  | { readonly kind: 'none' }
  | { readonly kind: 'single'; readonly stepId: WorkflowStepId }
  | {
      readonly kind: 'fork';
      readonly branchStepIds: readonly WorkflowStepId[];
      readonly joinStepId: WorkflowStepId;
      readonly joinRequiredCount: number;
    };

export interface ResolveNextStepsDeps {
  readonly conditionEvaluator: ConditionEvaluator;
  readonly policyConditionRepository: PolicyConditionRepository;
  readonly expressionRepository: ExpressionRepository;
}

function isParallelFork(transition: Transition): transition is ParallelTransition {
  return transition.type === 'parallel' && (transition as ParallelTransition).fork;
}

function isConditional(transition: Transition): transition is ConditionalTransition {
  return transition.type === 'conditional';
}

/** Resolves what step(s), if any, follow `fromStepId` given the current variables. */
export async function resolveNextSteps(
  organizationId: OrganizationId,
  fromStepId: WorkflowStepId,
  transitions: readonly Transition[],
  variables: Readonly<Record<string, unknown>>,
  deps: ResolveNextStepsDeps,
): Promise<NextStepsResolution> {
  const outgoing = transitions.filter((transition) => transition.fromStepId === fromStepId);
  if (outgoing.length === 0) return { kind: 'none' };

  const fork = outgoing.find(isParallelFork);
  if (fork) {
    return {
      kind: 'fork',
      branchStepIds: fork.branchStepIds,
      joinStepId: fork.toStepId,
      joinRequiredCount: fork.joinRequiredCount ?? fork.branchStepIds.length,
    };
  }

  const conditionals = outgoing.filter(isConditional).slice().sort((a, b) => a.priority - b.priority);

  for (const conditional of conditionals) {
    const policyCondition = await deps.policyConditionRepository.findById(organizationId, conditional.conditionId);
    if (!policyCondition) {
      throw new ConditionEvaluationError(`No PolicyCondition found for conditionId "${conditional.conditionId}"`);
    }
    const expression = await deps.expressionRepository.findById(organizationId, policyCondition.expressionId);
    if (!expression) {
      throw new ConditionEvaluationError(`No Expression found for expressionId "${policyCondition.expressionId}"`);
    }
    if (deps.conditionEvaluator.evaluate(expression, variables)) {
      return { kind: 'single', stepId: conditional.toStepId };
    }
  }

  const fallback = outgoing.find((transition) => transition.type === 'sequential' || transition.type === 'default');
  if (fallback) return { kind: 'single', stepId: fallback.toStepId };

  if (conditionals.length > 0) {
    throw new NoOutgoingTransitionError(fromStepId);
  }

  return { kind: 'none' };
}
