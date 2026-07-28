/** @module scheduling/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ScheduleId } from '../shared/identifiers.js';
import type { Schedule } from './types.js';

export interface ScheduleRepository extends Repository<Schedule, ScheduleId> {
  findAll(organizationId: OrganizationId): Promise<readonly Schedule[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Schedule[]>;
  findBaseline(organizationId: OrganizationId, projectId: ProjectId): Promise<Schedule | null>;
}
