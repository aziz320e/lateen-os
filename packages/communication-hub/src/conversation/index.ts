/**
 * Conversation Engine — real create/archive/reopen/assign/transfer/close
 * over 7 deterministic conversation types.
 * @module conversation
 */
export * from './types.js';
export * from './repository.js';
export { createConversationRepository } from './repository.impl.js';
export {
  createConversationLifecycle,
  canTransitionConversation,
  type ConversationLifecycle,
  type CreateConversationInput,
} from './lifecycle.impl.js';
