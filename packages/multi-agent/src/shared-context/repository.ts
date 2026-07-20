/** @module shared-context/repository */
import type { Repository } from '../shared/repository.js';
import type {
  SharedBusinessContext,
  SharedBusinessContextId,
  SharedDecisionReference,
  SharedDecisionReferenceId,
  SharedMemoryReference,
  SharedMemoryReferenceId,
} from './types.js';

export type SharedBusinessContextRepository = Repository<SharedBusinessContext, SharedBusinessContextId>;
export type SharedMemoryReferenceRepository = Repository<SharedMemoryReference, SharedMemoryReferenceId>;
export type SharedDecisionReferenceRepository = Repository<SharedDecisionReference, SharedDecisionReferenceId>;
