/** @module orchestrator/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrchestrationId,
  OrganizationId,
  PlanId,
  RuntimeAgentId,
} from '../shared/identifiers.js';

export type { OrchestrationId };

export type MultiAgentWorkflowStatus =
  | 'draft'
  | 'running'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled';

/** Coordinates multiple agents within a workflow. */
export interface AgentCoordinator {
  readonly leadAgentId: RuntimeAgentId;
  readonly participantAgentIds: readonly RuntimeAgentId[];
}

/** Multi-agent workflow orchestrated by the runtime. */
export interface MultiAgentWorkflow extends TenantAuditableEntity<OrchestrationId> {
  readonly name: string;
  readonly coordinator: AgentCoordinator;
  readonly planIds: readonly PlanId[];
  readonly status: MultiAgentWorkflowStatus;
}

export type { OrganizationId };
