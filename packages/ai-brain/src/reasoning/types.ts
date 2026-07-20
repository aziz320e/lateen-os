/** @module reasoning/types */
import type { IntentId } from '../intent/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  ReasoningSessionId,
  ReasoningStepId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { ReasoningContext } from './context.js';

export type { ReasoningSessionId, ReasoningStepId, OrganizationId };

export type ReasoningStepKind =
  | 'context_retrieval'
  | 'intent_analysis'
  | 'graph_traversal'
  | 'memory_lookup'
  | 'decision_evaluation'
  | 'route_selection'
  | 'plan_synthesis'
  | 'validation'
  | 'reflection';

export type ReasoningStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** Single step in a reasoning trace. */
export interface ReasoningStep extends TenantAuditableEntity<ReasoningStepId> {
  readonly sessionId: ReasoningSessionId;
  readonly order: number;
  readonly kind: ReasoningStepKind;
  readonly status: ReasoningStepStatus;
  readonly summary: string;
  readonly detail?: string;
  readonly durationMs?: number;
}

/** Human-readable explanation of a reasoning outcome. */
export interface ReasoningExplanation {
  readonly summary: string;
  readonly steps: readonly string[];
  readonly confidence: ScoreValue;
  readonly caveats?: readonly string[];
  readonly sourceReferences?: readonly string[];
}

/** Outcome of enterprise reasoning over context and intent. */
export interface ReasoningResult {
  readonly sessionId: ReasoningSessionId;
  readonly organizationId: OrganizationId;
  readonly intentId: IntentId;
  readonly context: ReasoningContext;
  readonly steps: readonly ReasoningStep[];
  readonly explanation: ReasoningExplanation;
  readonly completedAt: string;
  readonly success: boolean;
}
