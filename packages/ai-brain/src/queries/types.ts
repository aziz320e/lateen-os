/** @module queries/types */
import type { ExecutionPlan } from '../planner/types.js';
import type { ReasoningExplanation } from '../reasoning/types.js';
import type { RetrievedKnowledge } from '../memory/types.js';
import type {
  BrainExecutionPlanId,
  DecisionId,
  MissionId,
  OrganizationId,
  ReasoningSessionId,
} from '../shared/identifiers.js';

/** Query: explain an execution plan in human-readable form. */
export interface ExplainPlanQuery {
  readonly organizationId: OrganizationId;
  readonly planId: BrainExecutionPlanId;
}

export interface ExplainPlanResult {
  readonly plan: ExecutionPlan;
  readonly summary: string;
  readonly steps: readonly string[];
  readonly rationale: string;
}

/** Query: explain a platform decision referenced during reasoning. */
export interface ExplainDecisionQuery {
  readonly organizationId: OrganizationId;
  readonly decisionId: DecisionId;
  readonly reasoningSessionId?: ReasoningSessionId;
}

export interface ExplainDecisionResult {
  readonly decisionId: DecisionId;
  readonly summary: string;
  readonly explanation: ReasoningExplanation;
  readonly relatedPlanIds: readonly BrainExecutionPlanId[];
}

/** Query: explain why a mission was selected or planned. */
export interface ExplainMissionQuery {
  readonly organizationId: OrganizationId;
  readonly missionId: MissionId;
  readonly reasoningSessionId?: ReasoningSessionId;
}

export interface ExplainMissionResult {
  readonly missionId: MissionId;
  readonly summary: string;
  readonly rationale: string;
  readonly contributingFactors: readonly string[];
}

/** Query: find knowledge relevant to a topic or intent. */
export interface FindRelevantKnowledgeQuery {
  readonly organizationId: OrganizationId;
  readonly query: string;
  readonly limit?: number;
  readonly sessionId?: string;
}

export interface FindRelevantKnowledgeResult {
  readonly query: string;
  readonly entries: readonly RetrievedKnowledge[];
  readonly totalFound: number;
}
