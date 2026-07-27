/**
 * Validation — duplicate entity detection, dangling relationship
 * detection, orphan detection, and cycle validation.
 * @module validation
 */
export * from './types.js';
export { createGraphValidationEngine, type GraphValidationEngine } from './engine.impl.js';
