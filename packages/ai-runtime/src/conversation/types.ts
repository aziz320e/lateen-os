/** @module conversation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ConversationId,
  ConversationMessageId,
  ConversationThreadId,
  OrganizationId,
  RuntimeAgentId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ConversationId, ConversationMessageId, ConversationThreadId };

export type ConversationMessageRole = 'user' | 'agent' | 'system' | 'tool';

/** Single message in an agent conversation (not institutional memory). */
export interface ConversationMessage {
  readonly messageId: ConversationMessageId;
  readonly role: ConversationMessageRole;
  readonly content: string;
  readonly sentAt: Timestamp;
}

/** Thread of messages within a conversation. */
export interface ConversationThread {
  readonly threadId: ConversationThreadId;
  readonly messages: readonly ConversationMessage[];
}

/** Agent conversation session (runtime-scoped, not long-term memory). */
export interface Conversation extends TenantAuditableEntity<ConversationId> {
  readonly runtimeAgentId: RuntimeAgentId;
  readonly title?: string;
  readonly threads: readonly ConversationThread[];
}

export type { OrganizationId };
