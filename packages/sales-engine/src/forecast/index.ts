/**
 * Sales Forecast — deterministic weighted pipeline, stage probability,
 * expected revenue, and monthly forecast. No AI model.
 * @module forecast
 */
export * from './types.js';
export * from './repository.js';
export { createForecastSnapshotRepository } from './repository.impl.js';
export {
  createForecastEngine,
  probabilityForStage,
  computeWeightedAmount,
  STAGE_PROBABILITY,
  type ForecastEngine,
} from './engine.impl.js';
