/**
 * Attribution — deterministic first-touch, last-touch, and linear
 * models over recorded touchpoints.
 * @module attribution
 */
export * from './types.js';
export * from './repository.js';
export { createTouchpointRepository } from './repository.impl.js';
export { createAttributionEngine, computeAttribution, type AttributionEngine } from './engine.impl.js';
