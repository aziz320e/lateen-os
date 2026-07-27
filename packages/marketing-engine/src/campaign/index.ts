/**
 * Campaign Lifecycle + deterministic Campaign Types.
 * @module campaign
 */
export * from './types.js';
export * from './repository.js';
export { createCampaignRepository } from './repository.impl.js';
export {
  createCampaignLifecycle,
  canTransitionCampaign,
  type CampaignLifecycle,
  type CreateCampaignInput,
  type UpdateCampaignInput,
  type ScheduleCampaignInput,
} from './lifecycle.impl.js';
