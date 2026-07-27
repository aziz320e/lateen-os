/**
 * @lateen-os/communication-hub — Communication Hub
 *
 * Conversations, participants, messaging, channels, attachments, the
 * communication timeline, templates, notifications, scheduling, and
 * workflow integration for Lateen OS. Real, deterministic, offline
 * implementation — see `runtime.ts`'s `createCommunicationRuntime()`
 * for the composition root.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';
export * as conversation from './conversation/index.js';
export * as participant from './participant/index.js';
export * as message from './message/index.js';
export * as channel from './channel/index.js';
export * as attachment from './attachment/index.js';
export * as timeline from './timeline/index.js';
export * as template from './template/index.js';
export * as notification from './notification/index.js';
export * as scheduling from './scheduling/index.js';
export * as workflowIntegration from './workflow-integration/index.js';
export * as relationshipManagement from './relationship-management/index.js';
export * as queries from './queries/index.js';
export * as events from './events/index.js';

export {
  createCommunicationRuntime,
  type CommunicationRuntime,
  type CommunicationRuntimeDeps,
} from './runtime.js';

/** Aggregate interfaces. */
export type { Conversation, ConversationType, ConversationStatus, ConversationId } from './conversation/types.js';
export type {
  Participant,
  ParticipantType,
  ParticipantRole,
  ParticipantPermission,
  ParticipantStatus,
  ParticipantId,
} from './participant/types.js';
export type { Message, MessageType, MessageStatus, MessageId } from './message/types.js';
export type { ChannelType, ChannelSendRequest, ChannelSendResult, ChannelProvider } from './channel/types.js';
export type { Attachment, AttachmentType, AttachmentId } from './attachment/types.js';
export type { TimelineEntry, TimelineSource } from './timeline/types.js';
export type { Template, TemplateType, TemplateStatus, TemplateVersion, TemplateId, TemplateVersionId } from './template/types.js';
export type { Notification, NotificationType, NotificationStatus, NotificationId } from './notification/types.js';
export type {
  ScheduledItem,
  ScheduledItemType,
  ScheduledItemStatus,
  RecurrenceRule,
  RecurrenceFrequency,
  ScheduledItemId,
} from './scheduling/types.js';
export type { WorkflowRequest, CommunicationWorkflowType, WorkflowRequestStatus, WorkflowRequestId } from './workflow-integration/types.js';

/** Real lifecycle/service ports. */
export {
  canTransitionConversation,
  type ConversationLifecycle,
  type CreateConversationInput,
} from './conversation/lifecycle.impl.js';
export { type ParticipantService, type JoinConversationInput } from './participant/service.impl.js';
export { canTransitionMessage, type MessageLifecycle, type CreateMessageInput } from './message/lifecycle.impl.js';
export { createChannelProvider } from './channel/provider.impl.js';
export { type AttachmentService, type CreateAttachmentInput } from './attachment/service.impl.js';
export {
  canTransitionTemplate,
  renderTemplate,
  extractVariables,
  type TemplateEngine,
  type CreateTemplateInput,
  type UpdateTemplateInput,
} from './template/engine.impl.js';
export { canTransitionNotification, type NotificationService, type CreateNotificationInput } from './notification/service.impl.js';
export {
  computeNextOccurrence,
  type SchedulingService,
  type ScheduleMessageInput,
  type ScheduleNotificationInput,
} from './scheduling/service.impl.js';
export {
  type WorkflowIntegrationService,
  type WorkflowIntegrationDeps,
  type GenerateWorkflowRequestInput,
  type CompleteWorkflowRequestOutcome,
} from './workflow-integration/service.impl.js';
export { type TimelineService } from './timeline/engine.impl.js';
export { type TimelineDeps } from './timeline/types.js';

/** Real repository ports (internal to the runtime — types exported for advanced/testing use only). */
export type { ConversationRepository } from './conversation/repository.js';
export type { ParticipantRepository } from './participant/repository.js';
export type { MessageRepository } from './message/repository.js';
export type { AttachmentRepository } from './attachment/repository.js';
export type { TemplateRepository, TemplateVersionRepository } from './template/repository.js';
export type { NotificationRepository } from './notification/repository.js';
export type { ScheduledItemRepository } from './scheduling/repository.js';
export type { WorkflowRequestRepository } from './workflow-integration/repository.js';

/** Channel Registry. */
export { createChannelRegistry, type ChannelRegistry, type ChannelSendFunctions } from './channel/registry.impl.js';

/** Relationship Layer (CRM Engine / Sales Engine / Marketing Engine / Business DNA / Institutional Memory / Workflow Engine / AI Workforce integration). */
export { type RelationshipManagement, type RelationshipManagementDeps } from './relationship-management/index.js';

/** Query layer. */
export type { CommunicationQueries } from './queries/communication-queries.js';

/** Typed event bus. */
export type { CommunicationDomainEvent } from './events/communication-events.js';
export { COMMUNICATION_EVENT_NAMES } from './events/communication-events.js';
