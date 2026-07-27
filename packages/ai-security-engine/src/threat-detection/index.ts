/**
 * Threat Detection — deterministic detection of Prompt Injection,
 * Jailbreak attempts, Secret Leakage, Tool Abuse, and Rate Abuse. No
 * AI/LLM.
 * @module threat-detection
 */
export * from './types.js';
export * from './repository.js';
export { createThreatRepository } from './repository.impl.js';
export {
  createThreatDetectionEngine,
  detectPromptInjection,
  detectJailbreak,
  detectSecretLeakage,
  detectToolAbuse,
  detectRateAbuse,
  type ThreatDetectionEngine,
  type ScanPromptInput,
  type CheckToolAbuseInput,
  type CheckRateAbuseInput,
} from './engine.impl.js';
