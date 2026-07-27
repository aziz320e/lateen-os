/**
 * Messaging — deterministic messages across 8 required types, moving
 * through a guarded 7-state lifecycle, composed with the Channel
 * Registry for delivery.
 * @module message
 */
export * from './types.js';
export * from './repository.js';
export { createMessageRepository } from './repository.impl.js';
export {
  createMessageLifecycle,
  canTransitionMessage,
  type MessageLifecycle,
  type CreateMessageInput,
} from './lifecycle.impl.js';
