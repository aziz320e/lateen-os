/**
 * Contact Management — real create/update/archive/restore.
 * @module contact
 */
export * from './types.js';
export * from './repository.js';
export { createContactRepository } from './repository.impl.js';
export {
  createContactManagement,
  canTransitionContact,
  type ContactManagement,
  type CreateContactInput,
  type UpdateContactInput,
} from './service.impl.js';
