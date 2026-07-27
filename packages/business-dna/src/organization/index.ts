/**
 * Organization aggregate — root of Business DNA (Layer 1).
 * Lateen AI-first printing, manufacturing, and visual communications.
 *
 * @module organization
 */

export * from './types.js';
export * from './value-objects.js';
export * from './events.js';
export * from './repository.js';
export { createOrganizationRepository } from './repository.impl.js';
export {
  createOrganizationLifecycle,
  canTransitionOrganization,
  type OrganizationLifecycle,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from './lifecycle.impl.js';
