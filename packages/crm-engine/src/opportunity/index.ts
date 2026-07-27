/**
 * Opportunity Management + Deal Pipeline — real create/update plus a
 * guarded, deterministic pipeline state machine.
 * @module opportunity
 */
export * from './types.js';
export * from './repository.js';
export { createOpportunityRepository } from './repository.impl.js';
export {
  createOpportunityPipeline,
  canTransitionDealStage,
  type OpportunityPipeline,
  type CreateOpportunityInput,
  type UpdateOpportunityInput,
} from './pipeline.impl.js';
