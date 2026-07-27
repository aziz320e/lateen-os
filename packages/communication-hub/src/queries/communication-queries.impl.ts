/**
 * Real {@link CommunicationQueries} implementation — a CQRS read layer
 * composed over the Communication Hub repositories (plus the Timeline
 * service, itself a read composition). Repositories are taken as
 * constructor dependencies but never returned to callers.
 *
 * @module queries/communication-queries.impl
 */
import type { ConversationRepository } from '../conversation/repository.js';
import type { MessageRepository } from '../message/repository.js';
import type { NotificationRepository } from '../notification/repository.js';
import type { ParticipantRepository } from '../participant/repository.js';
import type { ScheduledItemRepository } from '../scheduling/repository.js';
import type { TemplateRepository } from '../template/repository.js';
import type { TimelineService } from '../timeline/index.js';
import type { CommunicationQueries } from './communication-queries.js';
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
  SearchCommunicationMatch,
  SearchCommunicationQuery,
  SearchCommunicationResult,
} from './types.js';

export interface CommunicationQueriesDeps {
  readonly conversationRepository: ConversationRepository;
  readonly messageRepository: MessageRepository;
  readonly participantRepository: ParticipantRepository;
  readonly templateRepository: TemplateRepository;
  readonly notificationRepository: NotificationRepository;
  readonly scheduledItemRepository: ScheduledItemRepository;
  readonly timelineService: Pick<TimelineService, 'buildTimeline'>;
}

function paginate<T>(items: readonly T[], offset?: number, limit?: number): readonly T[] {
  const start = offset ?? 0;
  return limit === undefined ? items.slice(start) : items.slice(start, start + limit);
}

function scoreLabel(label: string, keyword: string): number {
  const normalizedLabel = label.toLowerCase();
  const normalizedKeyword = keyword.toLowerCase();
  if (normalizedLabel === normalizedKeyword) return 3;
  if (normalizedLabel.includes(normalizedKeyword)) return 2;
  return 0;
}

/** Creates a real {@link CommunicationQueries} read port over the given repositories and the Timeline service. */
export function createCommunicationQueries(deps: CommunicationQueriesDeps): CommunicationQueries {
  return {
    async findConversations(query: FindConversationsQuery): Promise<FindConversationsResult> {
      let conversations = query.status
        ? await deps.conversationRepository.findByStatus(query.organizationId, query.status)
        : await deps.conversationRepository.findAll(query.organizationId);
      if (query.conversationType) conversations = conversations.filter((c) => c.conversationType === query.conversationType);
      return { conversations: paginate(conversations, query.offset, query.limit), total: conversations.length };
    },

    async findMessages(query: FindMessagesQuery): Promise<FindMessagesResult> {
      let messages = query.messageType
        ? await deps.messageRepository.findByType(query.organizationId, query.messageType)
        : await deps.messageRepository.findAll(query.organizationId);
      if (query.status) messages = messages.filter((m) => m.status === query.status);
      if (query.conversationId) messages = messages.filter((m) => m.conversationId === query.conversationId);
      return { messages: paginate(messages, query.offset, query.limit), total: messages.length };
    },

    async findParticipants(query: FindParticipantsQuery): Promise<FindParticipantsResult> {
      let participants = query.conversationId
        ? await deps.participantRepository.findByConversation(query.organizationId, query.conversationId)
        : await deps.participantRepository.findAll(query.organizationId);
      if (query.participantType) participants = participants.filter((p) => p.participantType === query.participantType);
      if (query.status) participants = participants.filter((p) => p.status === query.status);
      return { participants: paginate(participants, query.offset, query.limit), total: participants.length };
    },

    async findTemplates(query: FindTemplatesQuery): Promise<FindTemplatesResult> {
      let templates = query.templateType
        ? await deps.templateRepository.findByType(query.organizationId, query.templateType)
        : await deps.templateRepository.findAll(query.organizationId);
      if (query.status) templates = templates.filter((t) => t.status === query.status);
      return { templates: paginate(templates, query.offset, query.limit), total: templates.length };
    },

    async findTimeline(query: FindTimelineQuery): Promise<FindTimelineResult> {
      const entries = await deps.timelineService.buildTimeline(query.organizationId, query.limit);
      return { entries, total: entries.length };
    },

    async findNotifications(query: FindNotificationsQuery): Promise<FindNotificationsResult> {
      let notifications = query.notificationType
        ? await deps.notificationRepository.findByType(query.organizationId, query.notificationType)
        : await deps.notificationRepository.findAll(query.organizationId);
      if (query.status) notifications = notifications.filter((n) => n.status === query.status);
      if (query.recipientId) notifications = notifications.filter((n) => n.recipientId === query.recipientId);
      return { notifications: paginate(notifications, query.offset, query.limit), total: notifications.length };
    },

    async findScheduledMessages(query: FindScheduledMessagesQuery): Promise<FindScheduledMessagesResult> {
      let items = query.status
        ? await deps.scheduledItemRepository.findByStatus(query.organizationId, query.status)
        : await deps.scheduledItemRepository.findAll(query.organizationId);
      items = [...items].sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : a.scheduledFor > b.scheduledFor ? 1 : 0));
      return { items: paginate(items, query.offset, query.limit), total: items.length };
    },

    async searchCommunication(query: SearchCommunicationQuery): Promise<SearchCommunicationResult> {
      const [conversations, templates] = await Promise.all([
        deps.conversationRepository.findAll(query.organizationId),
        deps.templateRepository.findAll(query.organizationId),
      ]);

      const matches: SearchCommunicationMatch[] = [];
      for (const conversation of conversations) {
        const label = conversation.subject ?? conversation.conversationType;
        const score = scoreLabel(label, query.keyword);
        if (score > 0) matches.push({ recordType: 'conversation', id: conversation.id, label, score });
      }
      for (const template of templates) {
        const score = scoreLabel(template.name, query.keyword);
        if (score > 0) matches.push({ recordType: 'template', id: template.id, label: template.name, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });

      const limited = query.limit === undefined ? matches : matches.slice(0, query.limit);
      return { matches: limited, total: matches.length };
    },
  };
}
