/**
 * Competitor Registry — add/update/archive plus deterministic comparison
 * and ranking helpers.
 * @module competitor
 */
export * from './types.js';
export * from './events.js';
export * from './repository.js';
export { createCompetitorRepository } from './repository.impl.js';
export {
  createCompetitorRegistry,
  type CompetitorRegistry,
  type AddCompetitorInput,
  type UpdateCompetitorInput,
  type CompetitorComparison,
  type PricePosition,
} from './registry.impl.js';
