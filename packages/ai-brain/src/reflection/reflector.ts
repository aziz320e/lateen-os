/**
 * Reflection port for self-evaluation and plan improvement.
 *
 * @module reflection/reflector
 */

import type { ExecutionPlan } from '../planner/types.js';
import type { ReasoningResult } from '../reasoning/types.js';
import type { OrganizationId, ReflectionSessionId } from '../shared/identifiers.js';
import type { ReflectionResult } from './types.js';

/** Input for reflection over reasoning and plans. */
export interface ReflectionInput {
  readonly organizationId: OrganizationId;
  readonly sessionId: ReflectionSessionId;
  readonly reasoningResult: ReasoningResult;
  readonly plan?: ExecutionPlan;
}

/** Port for evaluating and improving reasoning outcomes. */
export interface BrainReflector {
  reflect(input: ReflectionInput): Promise<ReflectionResult>;
}
