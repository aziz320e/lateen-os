/**
 * Central AI Brain orchestration port.
 *
 * Coordinates intent recognition, reasoning, planning, validation, and reflection.
 * Does not execute business logic — delegates to AI Runtime, Workflow Engine, and Multi-Agent.
 *
 * @module brain
 */

import type { EnterpriseContextAssembler } from './context/assembler.js';
import type { IntentRecognizer } from './intent/recognizer.js';
import type { BrainPlanner } from './planner/planner.js';
import type { EnterpriseReasoner } from './reasoning/reasoner.js';
import type { PlatformRouter } from './routing/router.js';
import type { WorkingMemory } from './memory/working-memory.js';
import type { BrainReflector } from './reflection/reflector.js';
import type { PlanValidator } from './validation/validator.js';
import type { ExecutionPlan } from './planner/types.js';
import type { Intent } from './intent/types.js';
import type { ReasoningResult } from './reasoning/types.js';
import type { ReflectionResult } from './reflection/types.js';
import type { PlanValidationResult } from './validation/types.js';
import type { BrainSessionId, OrganizationId } from './shared/identifiers.js';
import type { CorrelationId } from './shared/primitives.js';

/** Full brain session request from an application or AI worker. */
export interface BrainSessionRequest {
  readonly organizationId: OrganizationId;
  readonly sessionId: BrainSessionId;
  readonly correlationId: CorrelationId;
  readonly rawInput: string;
  readonly actorId?: string;
  readonly conversationHistory?: readonly string[];
}

/** Full brain session response after reasoning and planning. */
export interface BrainSessionResponse {
  readonly intent: Intent;
  readonly reasoning: ReasoningResult;
  readonly plan: ExecutionPlan;
  readonly validation: PlanValidationResult;
  readonly reflection: ReflectionResult;
  readonly executionRequested: boolean;
}

/** Composition of all AI Brain capability ports. */
export interface BrainCapabilities {
  readonly intentRecognizer: IntentRecognizer;
  readonly contextAssembler: EnterpriseContextAssembler;
  readonly workingMemory: WorkingMemory;
  readonly reasoner: EnterpriseReasoner;
  readonly router: PlatformRouter;
  readonly planner: BrainPlanner;
  readonly validator: PlanValidator;
  readonly reflector: BrainReflector;
}

/** Central reasoning port — orchestrates platform services without executing business logic. */
export interface Brain {
  readonly capabilities: BrainCapabilities;

  process(request: BrainSessionRequest): Promise<BrainSessionResponse>;
}
