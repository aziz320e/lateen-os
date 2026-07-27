/**
 * Account Management — real create/update/archive/restore.
 * @module account
 */
export * from './types.js';
export * from './repository.js';
export { createAccountRepository } from './repository.impl.js';
export {
  createAccountManagement,
  canTransitionAccount,
  type AccountManagement,
  type CreateAccountInput,
  type UpdateAccountInput,
} from './service.impl.js';
