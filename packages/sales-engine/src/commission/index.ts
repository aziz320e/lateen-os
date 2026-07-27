/**
 * Commission Engine — fixed, percentage, and tiered commission plans,
 * plus a pure, deterministic calculator.
 * @module commission
 */
export * from './types.js';
export * from './repository.js';
export { createCommissionPlanRepository } from './repository.impl.js';
export {
  createCommissionEngine,
  calculateCommission,
  type CommissionEngine,
  type CreateCommissionPlanInput,
} from './engine.impl.js';
