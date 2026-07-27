/** @module queries/types */
import type { Conversation, ConversationStatus, ConversationType } from '../conversation/types.js';
import type { Message, MessageStatus, MessageType } from '../message/types.js';
import type { Participant, ParticipantStatus, ParticipantType } from '../participant/types.js';
import type { Notification, NotificationStatus, NotificationType } from '../notification/types.js';
import type { ScheduledItem, ScheduledItemStatus } from '../scheduling/types.js';
import type { ConversationId, OrganizationId } from '../shared/identifiers.js';
import type { OrganizationScopedQuery } from '../shared/repository.js';
import type { Template, TemplateStatus, TemplateType } from '../template/types.js';
import type { TimelineEntry } from '../timeline/types.js';

export interface FindConversationsQuery extends OrganizationScopedQuery {
  readonly status?: ConversationStatus;
  readonly conversationType?: ConversationType;
}
export interface FindConversationsResult {
  readonly conversations: readonly Conversation[];
  readonly total: number;
}

export interface FindMessagesQuery extends OrganizationScopedQuery {
  readonly conversationId?: ConversationId;
  readonly messageType?: MessageType;
  readonly status?: MessageStatus;
}
export interface FindMessagesResult {
  readonly messages: readonly Message[];
  readonly total: number;
}

export interface FindParticipantsQuery extends OrganizationScopedQuery {
  readonly conversationId?: ConversationId;
  readonly participantType?: ParticipantType;
  readonly status?: ParticipantStatus;
}
export interface FindParticipantsResult {
  readonly participants: readonly Participant[];
  readonly total: number;
}

export interface FindTemplatesQuery extends OrganizationScopedQuery {
  readonly templateType?: TemplateType;
  readonly status?: TemplateStatus;
}
export interface FindTemplatesResult {
  readonly templates: readonly Template[];
  readonly total: number;
}

export interface FindTimelineQuery {
  readonly organizationId: OrganizationId;
  readonly limit?: number;
}
export interface FindTimelineResult {
  readonly entries: readonly TimelineEntry[];
  readonly total: number;
}

export interface FindNotificationsQuery extends OrganizationScopedQuery {
  readonly notificationType?: NotificationType;
  readonly status?: NotificationStatus;
  readonly recipientId?: string;
}
export interface FindNotificationsResult {
  readonly notifications: readonly Notification[];
  readonly total: number;
}

export interface FindScheduledMessagesQuery extends OrganizationScopedQuery {
  readonly status?: ScheduledItemStatus;
}
export interface FindScheduledMessagesResult {
  readonly items: readonly ScheduledItem[];
  readonly total: number;
}

export type SearchCommunicationRecordType = 'conversation' | 'template';

export interface SearchCommunicationQuery {
  readonly organizationId: OrganizationId;
  readonly keyword: string;
  readonly limit?: number;
}

export interface SearchCommunicationMatch {
  readonly recordType: SearchCommunicationRecordType;
  readonly id: string;
  readonly label: string;
  readonly score: number;
}

export interface SearchCommunicationResult {
  readonly matches: readonly SearchCommunicationMatch[];
  readonly total: number;
}
