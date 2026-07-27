/** @module participant/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConversationId, ParticipantId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { ParticipantId };

/** Deterministic participant kind. */
export type ParticipantType = 'user' | 'ai_worker' | 'external_contact' | 'organization';

export type ParticipantRole = 'owner' | 'member' | 'observer';

export type ParticipantPermission = 'read' | 'write' | 'manage';

export type ParticipantStatus = 'active' | 'left';

/** A member of a conversation — a user, an AI worker, an external contact, or an organization. */
export interface Participant extends TenantAuditableEntity<ParticipantId> {
  readonly conversationId: ConversationId;
  readonly participantType: ParticipantType;
  /** External reference id — an Employee, Worker, CRM Contact, or CRM Account id, depending on `participantType`. */
  readonly referenceId?: string;
  readonly displayName: string;
  readonly role: ParticipantRole;
  readonly permissions: readonly ParticipantPermission[];
  readonly status: ParticipantStatus;
  readonly joinedAt: ISODateTime;
  readonly leftAt?: ISODateTime;
}

export type { OrganizationId } from '../shared/identifiers.js';
