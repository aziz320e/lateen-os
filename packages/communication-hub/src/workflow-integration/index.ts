/**
 * Workflow Integration — generates deterministic Workflow Engine
 * requests for approval reminders, follow-up reminders, overdue
 * notifications, and escalation notifications.
 * @module workflow-integration
 */
export * from './types.js';
export * from './repository.js';
export { createWorkflowRequestRepository } from './repository.impl.js';
export {
  createWorkflowIntegrationService,
  type WorkflowIntegrationService,
  type WorkflowIntegrationDeps,
  type GenerateWorkflowRequestInput,
  type CompleteWorkflowRequestOutcome,
} from './service.impl.js';
