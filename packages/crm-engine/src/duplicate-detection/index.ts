/**
 * Duplicate Detection — deterministic matching by email, phone, company,
 * and normalized name.
 * @module duplicate-detection
 */
export * from './types.js';
export {
  createCrmDuplicateDetectionEngine,
  detectDuplicates,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  type CrmDuplicateDetectionEngine,
} from './engine.impl.js';
