/**
 * Data Security — deterministic PII Detection, Data Classification,
 * Masking, Redaction, and Retention Rules. No AI/LLM.
 * @module data-security
 */
export * from './types.js';
export * from './repository.js';
export { createRetentionRuleRepository } from './repository.impl.js';
export {
  createDataSecurityService,
  detectPii,
  classifyData,
  maskText,
  redactText,
  isRetentionExpired,
  type DataSecurityService,
  type CreateRetentionRuleInput,
} from './engine.impl.js';
