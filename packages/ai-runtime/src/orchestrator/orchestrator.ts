/** @module orchestrator/orchestrator */
import type { OrchestrationId, OrganizationId } from '../shared/identifiers.js';
import type { MultiAgentWorkflow } from './types.js';

/** Port for multi-agent orchestration (implementation external to this package). */
export interface Orchestrator {
  startWorkflow(
    organizationId: OrganizationId,
    workflow: MultiAgentWorkflow,
  ): Promise<OrchestrationId>;

  pauseWorkflow(organizationId: OrganizationId, orchestrationId: OrchestrationId): Promise<void>;

  resumeWorkflow(organizationId: OrganizationId, orchestrationId: OrchestrationId): Promise<void>;

  cancelWorkflow(organizationId: OrganizationId, orchestrationId: OrchestrationId): Promise<void>;
}
