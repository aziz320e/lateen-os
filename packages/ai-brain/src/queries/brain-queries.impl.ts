/**
 * Real AI Brain query layer. Reads from the plan repository and reasoning
 * session store the composition root populates during `Brain.process()`.
 * `explainDecision`/`explainMission` scan recorded reasoning sessions for a
 * matching reference rather than calling into decision-engine/multi-agent
 * directly — those are consulted, when wired, during planning itself (see
 * `context/assembler.impl.ts` and `routing/router.impl.ts`).
 *
 * @module queries/brain-queries.impl
 */
import type { InMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExecutionPlan } from '../planner/types.js';
import type { ReasoningSessionStore } from '../reasoning/session-store.js';
import { DecisionExplanationNotFoundError, MissionExplanationNotFoundError, PlanNotFoundError } from '../shared/errors.js';
import type { BrainQueries } from './brain-queries.js';
import type {
  ExplainDecisionQuery,
  ExplainDecisionResult,
  ExplainMissionQuery,
  ExplainMissionResult,
  ExplainPlanQuery,
  ExplainPlanResult,
  FindRelevantKnowledgeQuery,
  FindRelevantKnowledgeResult,
} from './types.js';

export interface BrainQueriesDeps {
  readonly planRepository: InMemoryRepository<ExecutionPlan>;
  readonly reasoningSessions: ReasoningSessionStore;
}

/** Creates a {@link BrainQueries} read layer over AI Brain's own recorded history. */
export function createBrainQueries(deps: BrainQueriesDeps): BrainQueries {
  return {
    async explainPlan(query: ExplainPlanQuery): Promise<ExplainPlanResult> {
      const plan = await deps.planRepository.findById(query.organizationId, query.planId);
      if (!plan) throw new PlanNotFoundError(query.planId);

      return {
        plan,
        summary: plan.summary,
        steps: plan.graph.nodes.map((node) => node.label),
        rationale:
          plan.missionPlan?.rationale ??
          plan.workflowPlans[0]?.rationale ??
          plan.workerPlans[0]?.rationale ??
          'No routing rationale was recorded for this plan.',
      };
    },

    async explainDecision(query: ExplainDecisionQuery): Promise<ExplainDecisionResult> {
      const match = deps.reasoningSessions
        .list(query.organizationId)
        .find((session) => session.context.enterprise.mission?.relatedDecisionIds.includes(query.decisionId));
      if (!match) throw new DecisionExplanationNotFoundError(query.decisionId);

      return {
        decisionId: query.decisionId,
        summary: `Decision "${query.decisionId}" was considered during reasoning session "${match.sessionId}".`,
        explanation: match.explanation,
        relatedPlanIds: [],
      };
    },

    async explainMission(query: ExplainMissionQuery): Promise<ExplainMissionResult> {
      const match = deps.reasoningSessions
        .list(query.organizationId)
        .find((session) => session.context.enterprise.mission?.missionId === query.missionId);
      if (!match) throw new MissionExplanationNotFoundError(query.missionId);

      return {
        missionId: query.missionId,
        summary: `Mission "${query.missionId}" was referenced during reasoning session "${match.sessionId}".`,
        rationale: match.explanation.summary,
        contributingFactors: match.explanation.steps,
      };
    },

    async findRelevantKnowledge(query: FindRelevantKnowledgeQuery): Promise<FindRelevantKnowledgeResult> {
      const needle = query.query.toLowerCase();
      const matches = deps.planRepository
        .list(query.organizationId)
        .filter((plan) => plan.summary.toLowerCase().includes(needle))
        .slice(0, query.limit ?? 10)
        .map((plan) => ({
          entryId: plan.id,
          title: plan.summary,
          excerpt: plan.summary,
          relevance: plan.summary.toLowerCase() === needle ? '1.00' : '0.60',
          sourceType: 'execution_plan',
        }));

      return { query: query.query, entries: matches, totalFound: matches.length };
    },
  };
}
