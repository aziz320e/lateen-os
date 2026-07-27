/** Typed errors used consistently across the Communication Hub runtime implementations. @module shared/errors */

export class ConversationNotFoundError extends Error {
  constructor(readonly conversationId: string) {
    super(`Conversation "${conversationId}" not found`);
    this.name = 'ConversationNotFoundError';
  }
}

export class InvalidConversationTransitionError extends Error {
  constructor(
    readonly conversationId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Conversation "${conversationId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidConversationTransitionError';
  }
}

export class ParticipantNotFoundError extends Error {
  constructor(readonly participantId: string) {
    super(`Participant "${participantId}" not found`);
    this.name = 'ParticipantNotFoundError';
  }
}

export class MessageNotFoundError extends Error {
  constructor(readonly messageId: string) {
    super(`Message "${messageId}" not found`);
    this.name = 'MessageNotFoundError';
  }
}

export class InvalidMessageTransitionError extends Error {
  constructor(
    readonly messageId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Message "${messageId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidMessageTransitionError';
  }
}

export class AttachmentNotFoundError extends Error {
  constructor(readonly attachmentId: string) {
    super(`Attachment "${attachmentId}" not found`);
    this.name = 'AttachmentNotFoundError';
  }
}

export class TemplateNotFoundError extends Error {
  constructor(readonly templateId: string) {
    super(`Template "${templateId}" not found`);
    this.name = 'TemplateNotFoundError';
  }
}

export class InvalidTemplateTransitionError extends Error {
  constructor(
    readonly templateId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Template "${templateId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidTemplateTransitionError';
  }
}

export class NotificationNotFoundError extends Error {
  constructor(readonly notificationId: string) {
    super(`Notification "${notificationId}" not found`);
    this.name = 'NotificationNotFoundError';
  }
}

export class InvalidNotificationTransitionError extends Error {
  constructor(
    readonly notificationId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Notification "${notificationId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidNotificationTransitionError';
  }
}

export class ScheduledItemNotFoundError extends Error {
  constructor(readonly scheduledItemId: string) {
    super(`Scheduled item "${scheduledItemId}" not found`);
    this.name = 'ScheduledItemNotFoundError';
  }
}

export class InvalidScheduledItemTransitionError extends Error {
  constructor(
    readonly scheduledItemId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Scheduled item "${scheduledItemId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidScheduledItemTransitionError';
  }
}

export class WorkflowRequestNotFoundError extends Error {
  constructor(readonly workflowRequestId: string) {
    super(`Workflow request "${workflowRequestId}" not found`);
    this.name = 'WorkflowRequestNotFoundError';
  }
}

export class InvalidWorkflowRequestTransitionError extends Error {
  constructor(
    readonly workflowRequestId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Workflow request "${workflowRequestId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidWorkflowRequestTransitionError';
  }
}
