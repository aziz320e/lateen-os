/** Real in-memory {@link AvailabilityScheduleRepository} implementation. @module availability/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AvailabilitySchedule } from './types.js';
import type { AvailabilityScheduleRepository } from './repository.js';

/** Creates a real, in-memory {@link AvailabilityScheduleRepository}. */
export function createAvailabilityScheduleRepository(seed?: readonly AvailabilitySchedule[]): AvailabilityScheduleRepository {
  return createInMemoryRepository<AvailabilitySchedule>({ seed });
}
