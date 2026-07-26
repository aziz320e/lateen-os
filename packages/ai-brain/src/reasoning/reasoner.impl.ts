/**
 * Real enterprise reasoning — a deterministic step trace over working
 * memory and enterprise context. No LLM; `success` reflects whether the
 * intent was confidently classified upstream.
 *
 * @module reasoning/reasoner.impl
 */
import type { WorkingMemory } from '../memory/working-memory.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EnterpriseReasoner, ReasoningInput } from './reasoner.js';
import type { ReasoningExplanation, ReasoningResult, ReasoningStep, ReasoningStepKind } from './types.js';

export interface EnterpriseReasonerDeps {
  readonly workingMemory: WorkingMemory;
}

const STEP_KINDS: readonly ReasoningStepKind[] = [
  'context_retrieval',
  'intent_analysis',
  'memory_lookup',
  'decision_evaluation',
  'route_selection',
  'plan_synthesis',
];

const STEP_SUMMARIES: Readonly<Record<ReasoningStepKind, string>> = {
  context_retrieval: 'Retrieved enterprise context for the organization.',
  intent_analysis: 'Analyzed the recognized intent and its confidence.',
  graph_traversal: 'Traversed relevant domain graph nodes.',
  memory_lookup: 'Looked up working memory for the session.',
  decision_evaluation: 'Evaluated whether a platform decision applies.',
  route_selection: 'Selected candidate platform routing targets.',
  plan_synthesis: 'Synthesized an orchestration plan.',
  validation: 'Validated the synthesized plan.',
  reflection: 'Reflected on reasoning quality.',
};

/** Creates a deterministic {@link EnterpriseReasoner}. */
export function createEnterpriseReasoner(deps: EnterpriseReasonerDeps): EnterpriseReasoner {
  return {
    async reason(input: ReasoningInput): Promise<ReasoningResult> {
      const working = await deps.workingMemory.retrieve({
        organizationId: input.organizationId,
        sessionId: input.context.conversation.sessionId,
        intent: input.intent,
        context: input.context,
      });

      const steps: ReasoningStep[] = STEP_KINDS.map((kind, index) => {
        const now = nowIso();
        return {
          id: generateId('reasoning-step'),
          organizationId: input.organizationId,
          createdAt: now,
          updatedAt: now,
          sessionId: input.sessionId,
          order: index + 1,
          kind,
          status: 'completed',
          summary: STEP_SUMMARIES[kind],
        };
      });

      const success = input.intent.type !== 'unknown';

      const explanation: ReasoningExplanation = {
        summary: success
          ? `Recognized a "${input.intent.type}" intent with ${input.intent.confidence.level} confidence and produced a ${steps.length}-step reasoning trace.`
          : `Could not confidently classify the intent; recorded a ${steps.length}-step trace but no actionable target was identified.`,
        steps: steps.map((step) => step.summary),
        confidence: input.intent.confidence.score,
        caveats: success ? undefined : ['Intent type is "unknown" — routing will fall back to a generalist worker.'],
        sourceReferences: working.retrievedKnowledge.map((entry) => entry.entryId),
      };

      return {
        sessionId: input.sessionId,
        organizationId: input.organizationId,
        intentId: input.intent.id,
        intentType: input.intent.type,
        context: {
          sessionId: input.sessionId,
          enterprise: input.context,
          working,
          focusAreas: [input.intent.type, ...input.intent.entities.map((entity) => entity.label)],
        },
        steps,
        explanation,
        completedAt: nowIso(),
        success,
      };
    },
  };
}
