/** @module queries/communication-queries */
import type {
  FindConversationsQuery,
  FindConversationsResult,
  FindMessagesQuery,
  FindMessagesResult,
  FindNotificationsQuery,
  FindNotificationsResult,
  FindParticipantsQuery,
  FindParticipantsResult,
  FindScheduledMessagesQuery,
  FindScheduledMessagesResult,
  FindTemplatesQuery,
  FindTemplatesResult,
  FindTimelineQuery,
  FindTimelineResult,
  SearchCommunicationQuery,
  SearchCommunicationResult,
} from './types.js';

/** Real, read-only Communication Hub query port. */
export interface CommunicationQueries {
  findConversations(query: FindConversationsQuery): Promise<FindConversationsResult>;
  findMessages(query: FindMessagesQuery): Promise<FindMessagesResult>;
  findParticipants(query: FindParticipantsQuery): Promise<FindParticipantsResult>;
  findTemplates(query: FindTemplatesQuery): Promise<FindTemplatesResult>;
  findTimeline(query: FindTimelineQuery): Promise<FindTimelineResult>;
  findNotifications(query: FindNotificationsQuery): Promise<FindNotificationsResult>;
  findScheduledMessages(query: FindScheduledMessagesQuery): Promise<FindScheduledMessagesResult>;
  searchCommunication(query: SearchCommunicationQuery): Promise<SearchCommunicationResult>;
}
