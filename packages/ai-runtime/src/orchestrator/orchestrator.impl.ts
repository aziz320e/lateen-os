/**
 * Real {@link Orchestrator} implementation — a workflow status state
 * machine (draft/running -> waiting -> running -> completed/cancelled)
 * persisted through a {@link MultiAgentWorkflowRepository}, publishing
 * real domain events.
 *
 * @module orchestrator/orchestrator.impl
 */
import type { Orchestrator } from './orchestrator.js';
import type { MultiAgentWorkflowRepository } from './repository.js';
import type { RuntimeEventBus } from '../events/runtime-event-bus.js';

export interface OrchestratorDeps {
  readonly workflowRepository: MultiAgentWorkflowRepository;
  readonly eventBus?: RuntimeEventBus;
}

/** Creates an {@link Orchestrator} backed by a {@link MultiAgentWorkflowRepository}. */
export function createOrchestrator(deps: OrchestratorDeps): Orchestrator {
  return {
    async startWorkflow(organizationId, workflow) {
      const running = { ...workflow, status: 'running' as const, updatedAt: new Date().toISOString() };
      await deps.workflowRepository.save(running);
      deps.eventBus?.publish('orchestration.started', { orchestrationId: running.id, workflowId: running.id });
      return running.id;
    },

    async pauseWorkflow(organizationId, orchestrationId) {
      const workflow = await deps.workflowRepository.findById(organizationId, orchestrationId);
      if (!workflow) {
        throw new Error(`Workflow "${orchestrationId}" not found`);
      }
      await deps.workflowRepository.save({ ...workflow, status: 'waiting', updatedAt: new Date().toISOString() });
      deps.eventBus?.publish('orchestration.paused', { orchestrationId });
    },

    async resumeWorkflow(organizationId, orchestrationId) {
      const workflow = await deps.workflowRepository.findById(organizationId, orchestrationId);
      if (!workflow) {
        throw new Error(`Workflow "${orchestrationId}" not found`);
      }
      if (workflow.status !== 'waiting') {
        throw new Error(`Workflow "${orchestrationId}" is not paused (status: ${workflow.status})`);
      }
      await deps.workflowRepository.save({ ...workflow, status: 'running', updatedAt: new Date().toISOString() });
      deps.eventBus?.publish('orchestration.resumed', { orchestrationId });
    },

    async cancelWorkflow(organizationId, orchestrationId) {
      const workflow = await deps.workflowRepository.findById(organizationId, orchestrationId);
      if (!workflow) return;
      await deps.workflowRepository.save({ ...workflow, status: 'cancelled', updatedAt: new Date().toISOString() });
      deps.eventBus?.publish('orchestration.cancelled', { orchestrationId });
    },
  };
}
