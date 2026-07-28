/**
 * Real Attendance Engine — clock in/out, work sessions, and
 * deterministic overtime/lateness computation. No AI, no heuristics —
 * every figure is fixed arithmetic over the recorded timestamps.
 *
 * @module attendance/engine.impl
 */
import type { EmployeeId } from '../employee/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import { minutesBetweenIso } from '../shared/date.js';
import { OpenWorkSessionExistsError, WorkSessionAlreadyClosedError, WorkSessionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { HolidayId, OrganizationId, WorkSessionId } from '../shared/identifiers.js';
import type { ISODate, ISODateTime } from '../shared/primitives.js';
import type { AbsenceRecordRepository, HolidayRepository, WorkSessionRepository } from './repository.js';
import type { AbsenceRecord, Holiday, WorkSession } from './types.js';

/** Standard, deterministic work day length, in minutes (8 hours). */
export const STANDARD_WORK_MINUTES_PER_DAY = 480;

/** Pure: whole minutes between clock-in and clock-out. */
export function computeSessionDurationMinutes(clockInAt: ISODateTime, clockOutAt: ISODateTime): number {
  return Math.max(0, minutesBetweenIso(clockInAt, clockOutAt));
}

/** Pure: minutes worked beyond the standard work day. */
export function computeOvertimeMinutes(durationMinutes: number, standardMinutesPerDay: number = STANDARD_WORK_MINUTES_PER_DAY): number {
  return Math.max(0, durationMinutes - standardMinutesPerDay);
}

/** Pure: minutes late relative to the scheduled start (`0` if on time or early, or if no schedule was given). */
export function computeLateMinutes(clockInAt: ISODateTime, scheduledStartAt: ISODateTime | undefined): number {
  if (!scheduledStartAt) return 0;
  return Math.max(0, minutesBetweenIso(scheduledStartAt, clockInAt));
}

export interface ClockInInput {
  readonly at?: ISODateTime;
  readonly scheduledStartAt?: ISODateTime;
}

export interface ClockOutInput {
  readonly at?: ISODateTime;
}

export interface RecordAbsenceInput {
  readonly date: ISODate;
  readonly reason?: string;
}

export interface RegisterHolidayInput {
  readonly date: ISODate;
  readonly name: string;
}

export interface AttendanceEngine {
  /** Throws {@link OpenWorkSessionExistsError} if the employee already has an open session. */
  clockIn(organizationId: OrganizationId, employeeId: EmployeeId, input?: ClockInInput): Promise<WorkSession>;
  /** Closes the session, computing duration/overtime/lateness, and publishes `attendance.recorded`. */
  clockOut(organizationId: OrganizationId, workSessionId: WorkSessionId, input?: ClockOutInput): Promise<WorkSession>;
  getOpenSession(organizationId: OrganizationId, employeeId: EmployeeId): Promise<WorkSession | null>;
  getSession(organizationId: OrganizationId, workSessionId: WorkSessionId): Promise<WorkSession | null>;
  listSessions(organizationId: OrganizationId): Promise<readonly WorkSession[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly WorkSession[]>;

  recordAbsence(organizationId: OrganizationId, employeeId: EmployeeId, input: RecordAbsenceInput): Promise<AbsenceRecord>;
  listAbsences(organizationId: OrganizationId): Promise<readonly AbsenceRecord[]>;
  findAbsencesByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly AbsenceRecord[]>;

  registerHoliday(organizationId: OrganizationId, input: RegisterHolidayInput): Promise<Holiday>;
  isHoliday(organizationId: OrganizationId, date: ISODate): Promise<boolean>;
  listHolidays(organizationId: OrganizationId): Promise<readonly Holiday[]>;
  getHoliday(organizationId: OrganizationId, holidayId: HolidayId): Promise<Holiday | null>;
}

/** Creates a real {@link AttendanceEngine}. */
export function createAttendanceEngine(
  workSessionRepository: WorkSessionRepository,
  absenceRepository: AbsenceRecordRepository,
  holidayRepository: HolidayRepository,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): AttendanceEngine {
  return {
    async clockIn(organizationId, employeeId, input = {}) {
      const existing = await workSessionRepository.findOpenByEmployee(organizationId, employeeId);
      if (existing) throw new OpenWorkSessionExistsError(employeeId);

      const timestamp = now();
      const session: WorkSession = {
        id: generateId('work-session'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId,
        clockInAt: input.at ?? timestamp,
        scheduledStartAt: input.scheduledStartAt,
        status: 'open',
      };
      await workSessionRepository.save(session);
      return session;
    },

    async clockOut(organizationId, workSessionId, input = {}) {
      const session = await workSessionRepository.findById(organizationId, workSessionId);
      if (!session) throw new WorkSessionNotFoundError(workSessionId);
      if (session.status === 'closed') throw new WorkSessionAlreadyClosedError(workSessionId);

      const clockOutAt = input.at ?? now();
      const durationMinutes = computeSessionDurationMinutes(session.clockInAt, clockOutAt);
      const overtimeMinutes = computeOvertimeMinutes(durationMinutes);
      const lateMinutes = computeLateMinutes(session.clockInAt, session.scheduledStartAt);

      const updated: WorkSession = {
        ...session,
        clockOutAt,
        durationMinutes,
        overtimeMinutes,
        lateMinutes,
        status: 'closed',
        updatedAt: now(),
      };
      await workSessionRepository.save(updated);
      eventBus?.publish('attendance.recorded', { organizationId, employeeId: session.employeeId, workSessionId, durationMinutes });
      return updated;
    },

    async getOpenSession(organizationId, employeeId) {
      return workSessionRepository.findOpenByEmployee(organizationId, employeeId);
    },

    async getSession(organizationId, workSessionId) {
      return workSessionRepository.findById(organizationId, workSessionId);
    },

    async listSessions(organizationId) {
      return workSessionRepository.findAll(organizationId);
    },

    async findByEmployee(organizationId, employeeId) {
      return workSessionRepository.findByEmployee(organizationId, employeeId);
    },

    async recordAbsence(organizationId, employeeId, input) {
      const timestamp = now();
      const record: AbsenceRecord = {
        id: generateId('absence-record'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId,
        date: input.date,
        reason: input.reason,
      };
      await absenceRepository.save(record);
      return record;
    },

    async listAbsences(organizationId) {
      return absenceRepository.findAll(organizationId);
    },

    async findAbsencesByEmployee(organizationId, employeeId) {
      return absenceRepository.findByEmployee(organizationId, employeeId);
    },

    async registerHoliday(organizationId, input) {
      const timestamp = now();
      const holiday: Holiday = {
        id: generateId('holiday'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        date: input.date,
        name: input.name,
      };
      await holidayRepository.save(holiday);
      return holiday;
    },

    async isHoliday(organizationId, date) {
      return (await holidayRepository.findByDate(organizationId, date)) !== null;
    },

    async listHolidays(organizationId) {
      return holidayRepository.findAll(organizationId);
    },

    async getHoliday(organizationId, holidayId) {
      return holidayRepository.findById(organizationId, holidayId);
    },
  };
}
