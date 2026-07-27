/**
 * Lead Generation — inbound, outbound, referral, event, and
 * manual-import lead capture.
 * @module lead-generation
 */
export * from './types.js';
export * from './repository.js';
export { createMarketingLeadRepository } from './repository.impl.js';
export { createLeadGenerationService, type LeadGenerationService, type GenerateLeadInput } from './service.impl.js';
