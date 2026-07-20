/** @module availability/repository */
import type { Repository } from '../shared/repository.js';
import type { AvailabilitySchedule, AvailabilityScheduleId } from './types.js';

export type AvailabilityScheduleRepository = Repository<AvailabilitySchedule, AvailabilityScheduleId>;
