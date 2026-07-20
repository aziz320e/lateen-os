/** @module collaboration/types */
import type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  SharedContextId,
  TaskAssignmentId,
  TaskId,
  WorkerId,
  WorkforceConversationId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { WorkforceConversationId, TaskAssignmentId, SharedContextId };

export type ConversationStatus = 'open' | 'active' | 'paused' | 'closed' | 'archived';

export type ConversationParticipantType = 'worker' | 'employee' | 'team';

export interface ConversationParticipant {
  readonly type: ConversationParticipantType;
  readonly workerId?: WorkerId;
  readonly employeeId?: string;
  readonly teamId?: string;
}

/** Workforce-level conversation between workers and humans. */
export interface Conversation extends TenantAuditableEntity<WorkforceConversationId> {
  readonly title: string;
  readonly topic?: string;
  readonly status: ConversationStatus;
  readonly participants: readonly ConversationParticipant[];
  readonly relatedTaskId?: TaskId;
  readonly relatedKnowledgeEntryIds?: readonly KnowledgeEntryId[];
  readonly lastMessageAt?: Timestamp;
}

export type AssignmentStatus =
  | 'proposed'
  | 'accepted'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'cancelled';

/** Assignment of a runtime task to a workforce worker. */
export interface TaskAssignment extends TenantAuditableEntity<TaskAssignmentId> {
  readonly taskId: TaskId;
  readonly workerId: WorkerId;
  readonly assignedByWorkerId?: WorkerId;
  readonly status: AssignmentStatus;
  readonly priority: 'critical' | 'high' | 'normal' | 'low';
  readonly assignedAt: Timestamp;
  readonly dueAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

/** Shared context passed between collaborating workers. */
export interface SharedContext extends TenantAuditableEntity<SharedContextId> {
  readonly conversationId?: WorkforceConversationId;
  readonly taskAssignmentId?: TaskAssignmentId;
  readonly ownerWorkerId: WorkerId;
  readonly participantWorkerIds: readonly WorkerId[];
  readonly summary: string;
  readonly knowledgeEntryIds: readonly KnowledgeEntryId[];
  readonly expiresAt?: Timestamp;
}

export type { OrganizationId, WorkerId, TaskId };
