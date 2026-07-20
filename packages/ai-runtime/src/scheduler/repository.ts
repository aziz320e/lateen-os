/** @module scheduler/repository */
import type { OrganizationId, RuntimeAgentId, ScheduleId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Schedule } from './types.js';

export interface ScheduleRepository extends Repository<Schedule, ScheduleId> {
  findByAgent(
    organizationId: OrganizationId,
    runtimeAgentId: RuntimeAgentId,
  ): Promise<readonly Schedule[]>;
}
