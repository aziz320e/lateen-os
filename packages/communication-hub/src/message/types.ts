/** @module message/types */
import type { AttachmentId } from '../attachment/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConversationId, MessageId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { MessageId };

/** Deterministic message kind. */
export type MessageType = 'text' | 'email' | 'sms' | 'whatsapp' | 'system' | 'workflow' | 'ai' | 'notification';

export type MessageStatus = 'draft' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'archived';

/** A single deterministic message within a conversation. */
export interface Message extends TenantAuditableEntity<MessageId> {
  readonly conversationId: ConversationId;
  readonly messageType: MessageType;
  readonly status: MessageStatus;
  readonly senderParticipantId?: string;
  readonly recipient?: string;
  readonly body?: string;
  readonly attachmentIds: readonly AttachmentId[];
  readonly providerMessageId?: string;
  readonly sentAt?: ISODateTime;
  readonly deliveredAt?: ISODateTime;
  readonly readAt?: ISODateTime;
  readonly failedReason?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
