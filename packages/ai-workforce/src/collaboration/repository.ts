/** @module collaboration/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkerId } from '../shared/identifiers.js';
import type {
  Conversation,
  SharedContext,
  SharedContextId,
  TaskAssignment,
  TaskAssignmentId,
  WorkforceConversationId,
} from './types.js';

export type ConversationRepository = Repository<Conversation, WorkforceConversationId>;

export interface TaskAssignmentRepository extends Repository<TaskAssignment, TaskAssignmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly TaskAssignment[]>;
  findByWorker(organizationId: OrganizationId, workerId: WorkerId): Promise<readonly TaskAssignment[]>;
}

export type SharedContextRepository = Repository<SharedContext, SharedContextId>;
