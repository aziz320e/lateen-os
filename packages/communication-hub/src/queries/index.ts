/**
 * Query Layer — findConversations, findMessages, findParticipants,
 * findTemplates, findTimeline, findNotifications,
 * findScheduledMessages, searchCommunication.
 * @module queries
 */
export * from './types.js';
export * from './communication-queries.js';
export { createCommunicationQueries, type CommunicationQueriesDeps } from './communication-queries.impl.js';
