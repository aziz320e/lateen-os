/**
 * Customer Lifecycle — real create/update/archive/restore plus
 * deterministic duplicate merging.
 * @module customer
 */
export * from './types.js';
export * from './repository.js';
export { createCustomerRepository } from './repository.impl.js';
export {
  createCustomerLifecycle,
  canTransitionCustomer,
  type CustomerLifecycle,
  type CreateCustomerInput,
  type UpdateCustomerInput,
  type MergeCustomersResult,
} from './lifecycle.impl.js';
