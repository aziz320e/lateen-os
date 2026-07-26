/**
 * Real reflection — deterministic self-evaluation of a reasoning result and
 * its (optional) plan, producing improvement suggestions when gaps exist.
 *
 * @module reflection/reflector.impl
 */
import { nowIso } from '../shared/id.js';
import type { BrainReflector, ReflectionInput } from './reflector.js';
import type { PlanImprovement, ReflectionResult, SelfEvaluation } from './types.js';

/** Creates a deterministic {@link BrainReflector}. */
export function createBrainReflector(): BrainReflector {
  return {
    async reflect(input: ReflectionInput): Promise<ReflectionResult> {
      const { reasoningResult, plan } = input;
      const gaps: string[] = [];
      const strengths: string[] = [];

      if (!reasoningResult.success) {
        gaps.push('Intent could not be confidently classified.');
      } else {
        strengths.push('Intent was classified with a traceable reasoning path.');
      }

      const hasTarget = Boolean(plan?.missionPlan) || (plan?.workflowPlans.length ?? 0) > 0 || (plan?.workerPlans.length ?? 0) > 0;
      if (!plan) {
        gaps.push('No execution plan was produced.');
      } else if (!hasTarget) {
        gaps.push('Execution plan has no mission, workflow, or worker target.');
      } else {
        strengths.push('Execution plan resolves to at least one actionable target.');
      }

      const completedSteps = reasoningResult.steps.filter((step) => step.status === 'completed').length;
      const completeness = (completedSteps / Math.max(reasoningResult.steps.length, 1)).toFixed(2);
      const riskLevel: SelfEvaluation['riskLevel'] = !reasoningResult.success ? 'high' : !hasTarget ? 'medium' : 'low';

      const evaluation: SelfEvaluation = {
        completeness,
        confidence: reasoningResult.explanation.confidence,
        riskLevel,
        gaps,
        strengths,
      };

      const improvements: PlanImprovement[] = [];
      if (plan && !hasTarget) {
        improvements.push({
          planId: plan.id,
          category: 'routing',
          suggestion: 'No route was selected — clarify the objective so a mission, workflow, or worker can be targeted.',
          priority: 'high',
        });
      }
      if (!reasoningResult.success && plan) {
        improvements.push({
          planId: plan.id,
          category: 'clarification',
          suggestion: 'Ask a clarifying question — the intent could not be confidently classified.',
          priority: 'critical',
        });
      }

      return {
        sessionId: input.sessionId,
        organizationId: input.organizationId,
        reasoningResult,
        plan,
        evaluation,
        improvements,
        shouldRevise: gaps.length > 0,
        completedAt: nowIso(),
      };
    },
  };
}
