/**
 * Sales Tasks — real proposal approval, contract review, and follow-up
 * reminder tasks, generating deterministic Workflow Engine requests
 * through its public runtime API only.
 * @module task
 */
export * from './types.js';
export * from './repository.js';
export { createSalesTaskRepository } from './repository.impl.js';
export {
  createSalesTasksService,
  type SalesTasksService,
  type SalesTasksDeps,
  type GenerateSalesTaskInput,
  type CompleteSalesTaskOutcome,
} from './service.impl.js';
