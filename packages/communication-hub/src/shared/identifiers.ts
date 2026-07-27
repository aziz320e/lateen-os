/**
 * Identifier types for the Communication Hub bounded context.
 *
 * Where a sibling package already owns a canonical id (Organization,
 * Employee from Business DNA; Contact, Account from CRM Engine; Worker
 * from AI Workforce), it is reused directly rather than redefined.
 *
 * @module shared/identifiers
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';

export type { EmployeeId, OrganizationId } from '@lateen-os/business-dna';
export type { AccountId, ContactId } from '@lateen-os/crm-engine';
export type { WorkerId } from '@lateen-os/ai-workforce';

/** Generic entity identifier. */
export type EntityId = Identifier;

/** Conversation aggregate identifier. */
export type ConversationId = Identifier;

/** Participant identifier. */
export type ParticipantId = Identifier;

/** Message identifier. */
export type MessageId = Identifier;

/** Attachment identifier. */
export type AttachmentId = Identifier;

/** Template identifier. */
export type TemplateId = Identifier;

/** Template version identifier. */
export type TemplateVersionId = Identifier;

/** Notification identifier. */
export type NotificationId = Identifier;

/** Scheduled item identifier. */
export type ScheduledItemId = Identifier;

/** Workflow integration request identifier. */
export type WorkflowRequestId = Identifier;
