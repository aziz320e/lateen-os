/**
 * Sales Opportunity Lifecycle + deterministic Sales Pipeline.
 * @module opportunity
 */
export * from './types.js';
export * from './repository.js';
export { createSalesOpportunityRepository } from './repository.impl.js';
export {
  createSalesOpportunityLifecycle,
  canTransitionSalesStage,
  type SalesOpportunityLifecycle,
  type CreateSalesOpportunityInput,
  type UpdateSalesOpportunityInput,
} from './lifecycle.impl.js';
