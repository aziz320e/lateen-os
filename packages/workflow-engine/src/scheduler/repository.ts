/** @module scheduler/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkflowSchedule, WorkflowScheduleId } from './types.js';

export type WorkflowScheduleRepository = Repository<WorkflowSchedule, WorkflowScheduleId>;
