/** @module timeline/repository */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId, MemoryTimelineId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemoryTimeline, TimelineEventSubjectType } from './types.js';

export interface MemoryTimelineRepository extends Repository<MemoryTimeline, MemoryTimelineId> {
  findBySubject(
    organizationId: OrganizationId,
    subjectType: TimelineEventSubjectType,
    subjectId: Identifier,
  ): Promise<MemoryTimeline | null>;
}
