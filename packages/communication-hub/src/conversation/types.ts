/** @module conversation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConversationId } from '../shared/identifiers.js';
import type { CommunicationTag, ISODateTime } from '../shared/primitives.js';

export type { ConversationId };

/** Deterministic conversation channel/context. */
export type ConversationType = 'customer' | 'internal' | 'sales' | 'marketing' | 'support' | 'workflow' | 'ai';

export type ConversationStatus = 'open' | 'archived' | 'closed';

/** A conversation moving through a guarded, deterministic lifecycle. */
export interface Conversation extends TenantAuditableEntity<ConversationId> {
  readonly subject?: string;
  readonly conversationType: ConversationType;
  readonly status: ConversationStatus;
  /** An external reference id (Employee, AI Worker, or User id) currently responsible for this conversation. */
  readonly assignedToId?: string;
  /** Every assignee this conversation has ever been transferred away from, oldest first. */
  readonly previousAssigneeIds: readonly string[];
  readonly archivedAt?: ISODateTime;
  readonly closedAt?: ISODateTime;
  readonly tags: readonly CommunicationTag[];
}

export type { OrganizationId } from '../shared/identifiers.js';
