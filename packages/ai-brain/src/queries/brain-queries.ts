/** @module queries/brain-queries */
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

/** Read-side query port for AI Brain inspection and explanation. */
export interface BrainQueries {
  explainPlan(query: ExplainPlanQuery): Promise<ExplainPlanResult>;

  explainDecision(query: ExplainDecisionQuery): Promise<ExplainDecisionResult>;

  explainMission(query: ExplainMissionQuery): Promise<ExplainMissionResult>;

  findRelevantKnowledge(query: FindRelevantKnowledgeQuery): Promise<FindRelevantKnowledgeResult>;
}
