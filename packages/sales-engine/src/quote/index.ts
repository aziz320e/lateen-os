/**
 * Quote Engine — real create/update/archive with deterministic totals,
 * tax, and discount calculation, plus version history.
 * @module quote
 */
export * from './types.js';
export * from './repository.js';
export { createQuoteRepository, createQuoteVersionRepository } from './repository.impl.js';
export {
  createQuoteEngine,
  computeQuoteTotals,
  type QuoteEngine,
  type CreateQuoteInput,
  type UpdateQuoteInput,
} from './engine.impl.js';
