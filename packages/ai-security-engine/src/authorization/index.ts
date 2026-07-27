/**
 * Authorization — RBAC with role inheritance, ABAC, policy-based
 * access, permission checks, and tenant isolation.
 * @module authorization
 */
export * from './types.js';
export * from './repository.js';
export { createRoleRepository, createPolicyRepository, createRoleAssignmentRepository } from './repository.impl.js';
export {
  createAuthorizationService,
  type AuthorizationService,
  type CreateRoleInput,
  type CreatePolicyInput,
  type UpdatePolicyInput,
} from './service.impl.js';
