/**
 * Business Profile — singleton-per-organization company metadata, industry,
 * legal entity, and market/product/service references.
 * @module business-profile
 */
export * from './types.js';
export * from './events.js';
export * from './repository.js';
export { createBusinessProfileRepository } from './repository.impl.js';
export {
  createBusinessProfileService,
  type BusinessProfileService,
  type UpsertBusinessProfileInput,
} from './service.impl.js';
