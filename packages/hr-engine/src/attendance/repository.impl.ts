/** Real, in-memory Attendance Engine repositories. @module attendance/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { AbsenceRecordRepository, HolidayRepository, WorkSessionRepository } from './repository.js';
import type { AbsenceRecord, Holiday, WorkSession } from './types.js';

/** Creates a real, in-memory {@link WorkSessionRepository}. */
export function createWorkSessionRepository(seed?: readonly WorkSession[]): WorkSessionRepository {
  const repo = createInMemoryRepository<WorkSession>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((session) => session.employeeId === employeeId);
    },
    async findOpenByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).find((session) => session.employeeId === employeeId && session.status === 'open') ?? null;
    },
  };
}

/** Creates a real, in-memory {@link AbsenceRecordRepository}. */
export function createAbsenceRecordRepository(seed?: readonly AbsenceRecord[]): AbsenceRecordRepository {
  const repo = createInMemoryRepository<AbsenceRecord>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((record) => record.employeeId === employeeId);
    },
  };
}

/** Creates a real, in-memory {@link HolidayRepository}. */
export function createHolidayRepository(seed?: readonly Holiday[]): HolidayRepository {
  const repo = createInMemoryRepository<Holiday>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDate(organizationId, date) {
      return repo.list(organizationId).find((holiday) => holiday.date === date) ?? null;
    },
  };
}
