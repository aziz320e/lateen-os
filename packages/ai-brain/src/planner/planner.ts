/**
 * Planning port for AI Brain.
 *
 * @module planner/planner
 */

import type { Intent } from '../intent/types.js';
import type { EnterpriseContext } from '../context/types.js';
import type { RoutingDecision } from '../routing/types.js';
import type { OrganizationId, ReasoningSessionId } from '../shared/identifiers.js';
import type { ExecutionPlan } from './types.js';

/** Input bundle for plan creation. */
export interface PlanningInput {
  readonly organizationId: OrganizationId;
  readonly reasoningSessionId: ReasoningSessionId;
  readonly intent: Intent;
  readonly context: EnterpriseContext;
  /** Routing decision the plan's mission/workflow/worker entries are grounded in. */
  readonly routing: RoutingDecision;
}

/** Port for creating platform orchestration plans from intent and context. */
export interface BrainPlanner {
  createPlan(input: PlanningInput): Promise<ExecutionPlan>;
}
