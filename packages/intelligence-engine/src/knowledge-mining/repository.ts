/** @module knowledge-mining/repository */
import type { KnowledgeFindingId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { KnowledgeFinding } from './types.js';

export interface KnowledgeFindingRepository extends Repository<
  KnowledgeFinding,
  KnowledgeFindingId
> {}
