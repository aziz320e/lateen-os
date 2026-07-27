/**
 * Lead Management — real create/qualify/convert/reject/reopen.
 * @module lead
 */
export * from './types.js';
export * from './repository.js';
export { createLeadRepository } from './repository.impl.js';
export {
  createLeadLifecycle,
  canTransitionLead,
  type LeadLifecycle,
  type CreateLeadInput,
  type ConvertLeadInput,
  type ConvertLeadResult,
} from './lifecycle.impl.js';
