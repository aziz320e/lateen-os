/** @module collaboration/repository */
import type { Repository } from '../shared/repository.js';
import type {
  Conversation,
  SharedContext,
  SharedContextId,
  TaskAssignment,
  TaskAssignmentId,
  WorkforceConversationId,
} from './types.js';

export type ConversationRepository = Repository<Conversation, WorkforceConversationId>;
export type TaskAssignmentRepository = Repository<TaskAssignment, TaskAssignmentId>;
export type SharedContextRepository = Repository<SharedContext, SharedContextId>;
