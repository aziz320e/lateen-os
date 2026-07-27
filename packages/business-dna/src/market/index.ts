/**
 * Market Model — singleton-per-organization countries, regions, languages,
 * currencies, and operating markets.
 * @module market
 */
export * from './types.js';
export * from './repository.js';
export { createMarketModelRepository } from './repository.impl.js';
export {
  createMarketEngine,
  type MarketEngine,
  type AddOperatingMarketInput,
  type UpdateOperatingMarketInput,
} from './engine.impl.js';
