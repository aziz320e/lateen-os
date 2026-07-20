/** @module reflection/types */
import type { ExecutionPlan } from '../planner/types.js';
import type { ReasoningResult } from '../reasoning/types.js';
import type {
  BrainExecutionPlanId,
  OrganizationId,
  ReflectionSessionId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { ReflectionSessionId, OrganizationId };

/** Self-assessment of reasoning quality. */
export interface SelfEvaluation {
  readonly completeness: ScoreValue;
  readonly confidence: ScoreValue;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly gaps: readonly string[];
  readonly strengths: readonly string[];
}

/** Suggested improvement to a plan before execution. */
export interface PlanImprovement {
  readonly planId: BrainExecutionPlanId;
  readonly category: 'routing' | 'validation' | 'resource' | 'sequencing' | 'clarification';
  readonly suggestion: string;
  readonly priority: 'critical' | 'high' | 'medium' | 'low';
}

/** Outcome of post-reasoning reflection. */
export interface ReflectionResult {
  readonly sessionId: ReflectionSessionId;
  readonly organizationId: OrganizationId;
  readonly reasoningResult: ReasoningResult;
  readonly plan?: ExecutionPlan;
  readonly evaluation: SelfEvaluation;
  readonly improvements: readonly PlanImprovement[];
  readonly shouldRevise: boolean;
  readonly completedAt: string;
}
