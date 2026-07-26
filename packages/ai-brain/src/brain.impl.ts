/**
 * AI Brain composition root. Wires intent recognition, context assembly,
 * working memory, reasoning, routing, planning, validation, and reflection
 * into the single `Brain.process()` pipeline: accepts a business objective
 * (`rawInput`), gathers enterprise context (optionally enriched from
 * decision-engine), invokes AI Runtime's agent registry during routing
 * (when injected), and returns a structured, validated execution plan.
 *
 * Does not execute business logic itself — coordinates AI Runtime,
 * Workflow Engine, and Multi-Agent by producing plans shaped to their real
 * id types; a caller above this package (e.g. CEO Engine, via `sdk`) is
 * responsible for actually invoking them with the returned plan.
 *
 * @module brain.impl
 */
import type { AgentRegistryService } from '@lateen-os/ai-runtime';
import type { DecisionQueries } from '@lateen-os/decision-engine';
import { createInMemoryRepository, type InMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Brain, BrainCapabilities, BrainSessionRequest, BrainSessionResponse } from './brain.js';
import { createEnterpriseContextAssembler } from './context/assembler.impl.js';
import type { EnterpriseContextAssembler } from './context/assembler.js';
import { createBrainEventBus, type BrainEventBus } from './events/brain-event-bus.js';
import { createIntentRecognizer } from './intent/recognizer.impl.js';
import type { IntentRecognizer } from './intent/recognizer.js';
import { createWorkingMemory } from './memory/working-memory.impl.js';
import type { WorkingMemory } from './memory/working-memory.js';
import { createBrainPlanner } from './planner/planner.impl.js';
import type { BrainPlanner } from './planner/planner.js';
import type { ExecutionPlan } from './planner/types.js';
import { createBrainQueries } from './queries/brain-queries.impl.js';
import type { BrainQueries } from './queries/brain-queries.js';
import { createEnterpriseReasoner } from './reasoning/reasoner.impl.js';
import type { EnterpriseReasoner } from './reasoning/reasoner.js';
import { createReasoningSessionStore, type ReasoningSessionStore } from './reasoning/session-store.js';
import { createBrainReflector } from './reflection/reflector.impl.js';
import type { BrainReflector } from './reflection/reflector.js';
import { createPlatformRouter } from './routing/router.impl.js';
import type { PlatformRouter } from './routing/router.js';
import { generateId } from './shared/id.js';
import { createPlanValidator } from './validation/validator.impl.js';
import type { PlanValidator } from './validation/validator.js';

export interface BrainDeps {
  /** Real ai-runtime collaborator — used by the router to pick an actually-registered agent. */
  readonly agentRegistry?: AgentRegistryService;
  /** Real decision-engine collaborator — used by the context assembler to surface pending approvals. */
  readonly decisionQueries?: DecisionQueries;
  readonly eventBus?: BrainEventBus;
  readonly planRepository?: InMemoryRepository<ExecutionPlan>;
  readonly reasoningSessions?: ReasoningSessionStore;
  /** Overrides individual ports instead of the defaults built from the deps above. */
  readonly capabilities?: Partial<BrainCapabilities>;
}

function buildCapabilities(deps: BrainDeps): BrainCapabilities {
  const intentRecognizer: IntentRecognizer = deps.capabilities?.intentRecognizer ?? createIntentRecognizer();
  const contextAssembler: EnterpriseContextAssembler =
    deps.capabilities?.contextAssembler ?? createEnterpriseContextAssembler({ decisionQueries: deps.decisionQueries });
  const workingMemory: WorkingMemory = deps.capabilities?.workingMemory ?? createWorkingMemory();
  const reasoner: EnterpriseReasoner = deps.capabilities?.reasoner ?? createEnterpriseReasoner({ workingMemory });
  const router: PlatformRouter = deps.capabilities?.router ?? createPlatformRouter({ agentRegistry: deps.agentRegistry });
  const planner: BrainPlanner = deps.capabilities?.planner ?? createBrainPlanner();
  const validator: PlanValidator = deps.capabilities?.validator ?? createPlanValidator();
  const reflector: BrainReflector = deps.capabilities?.reflector ?? createBrainReflector();

  return { intentRecognizer, contextAssembler, workingMemory, reasoner, router, planner, validator, reflector };
}

/** Creates the central {@link Brain} orchestration facade. */
export function createBrain(
  deps: BrainDeps & { readonly planRepository: InMemoryRepository<ExecutionPlan>; readonly reasoningSessions: ReasoningSessionStore },
): Brain {
  const capabilities = buildCapabilities(deps);
  const { planRepository, reasoningSessions, eventBus } = deps;

  return {
    capabilities,

    async process(request: BrainSessionRequest): Promise<BrainSessionResponse> {
      const intent = await capabilities.intentRecognizer.recognize({
        organizationId: request.organizationId,
        sessionId: request.sessionId,
        rawInput: request.rawInput,
      });
      eventBus?.publish('intent.recognized', {
        intentId: intent.id,
        intentType: intent.type,
        summary: intent.summary,
        confidenceScore: intent.confidence.score,
      });

      const context = await capabilities.contextAssembler.assemble({
        organizationId: request.organizationId,
        sessionId: request.sessionId,
        correlationId: request.correlationId,
        intent,
        conversationHistory: request.conversationHistory,
      });

      const reasoningSessionId = generateId('reasoning-session');
      const reasoning = await capabilities.reasoner.reason({
        organizationId: request.organizationId,
        sessionId: reasoningSessionId,
        intent,
        context,
      });
      reasoningSessions.save(reasoning);
      eventBus?.publish('reasoning.completed', {
        sessionId: reasoning.sessionId,
        intentId: intent.id,
        success: reasoning.success,
        stepCount: reasoning.steps.length,
      });

      const routing = await capabilities.router.route({
        organizationId: request.organizationId,
        reasoningResult: reasoning,
      });

      const plan = await capabilities.planner.createPlan({
        organizationId: request.organizationId,
        reasoningSessionId,
        intent,
        context,
        routing,
      });
      await planRepository.save(plan);
      eventBus?.publish('plan.created', { planId: plan.id, intentId: intent.id, summary: plan.summary });

      const validation = await capabilities.validator.validate({
        organizationId: request.organizationId,
        plan,
        context,
        actorId: request.actorId,
      });

      const finalPlan: ExecutionPlan = validation.approved
        ? { ...plan, status: 'ready' }
        : {
            ...plan,
            status: 'rejected',
            rejectionReason:
              validation.permission.violations[0] ??
              validation.policy.violations[0] ??
              validation.business.violations[0] ??
              'Plan was not approved.',
          };
      if (finalPlan.status !== plan.status) {
        await planRepository.save(finalPlan);
      }
      if (!validation.approved) {
        eventBus?.publish('plan.rejected', {
          planId: finalPlan.id,
          intentId: intent.id,
          reason: finalPlan.rejectionReason ?? 'Plan was not approved.',
        });
      }

      const reflection = await capabilities.reflector.reflect({
        organizationId: request.organizationId,
        sessionId: generateId('reflection-session'),
        reasoningResult: reasoning,
        plan: finalPlan,
      });

      const executionRequested = validation.approved;
      if (executionRequested) {
        eventBus?.publish('execution.requested', {
          planId: finalPlan.id,
          organizationId: request.organizationId,
          requestedBy: request.actorId,
        });
      }

      return { intent, reasoning, plan: finalPlan, validation, reflection, executionRequested };
    },
  };
}

export interface BrainSystem {
  readonly brain: Brain;
  readonly queries: BrainQueries;
}

/** Creates a {@link Brain} and a {@link BrainQueries} layer sharing the same underlying stores. */
export function createBrainSystem(deps: BrainDeps = {}): BrainSystem {
  const planRepository = deps.planRepository ?? createInMemoryRepository<ExecutionPlan>();
  const reasoningSessions = deps.reasoningSessions ?? createReasoningSessionStore();

  const brain = createBrain({ ...deps, planRepository, reasoningSessions });
  const queries = createBrainQueries({ planRepository, reasoningSessions });

  return { brain, queries };
}

/** Creates a real, self-contained {@link BrainEventBus} for callers that don't inject their own. */
export { createBrainEventBus };
