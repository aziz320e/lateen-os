/**
 * Participants — users, AI workers, external contacts, and
 * organizations joining and leaving conversations, with roles and
 * permissions.
 * @module participant
 */
export * from './types.js';
export * from './repository.js';
export { createParticipantRepository } from './repository.impl.js';
export { createParticipantService, type ParticipantService, type JoinConversationInput } from './service.impl.js';
