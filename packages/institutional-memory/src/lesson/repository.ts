/** @module lesson/repository */
import type { OrganizationId, LessonLearnedId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemoryTag } from '../shared/primitives.js';
import type { LessonLearned, LessonLearnedStatus } from './types.js';

export interface LessonLearnedRepository extends Repository<LessonLearned, LessonLearnedId> {
  findByTag(organizationId: OrganizationId, tag: MemoryTag): Promise<readonly LessonLearned[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: LessonLearnedStatus,
  ): Promise<readonly LessonLearned[]>;
}
