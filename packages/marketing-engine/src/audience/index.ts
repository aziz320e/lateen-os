/**
 * Audience Engine — static and dynamic audiences, deterministic
 * segmentation, resolved through the CRM Engine's public API only.
 * @module audience
 */
export * from './types.js';
export * from './repository.js';
export { createAudienceRepository } from './repository.impl.js';
export {
  createAudienceEngine,
  applyAudienceFilters,
  type AudienceEngine,
  type AudienceEngineDeps,
  type CreateAudienceInput,
  type UpdateAudienceInput,
} from './engine.impl.js';
