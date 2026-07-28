import { describe, expect, it } from 'vitest';
import {
  computeLateMinutes,
  computeOvertimeMinutes,
  computeSessionDurationMinutes,
  createAttendanceEngine,
  STANDARD_WORK_MINUTES_PER_DAY,
} from '../src/attendance/engine.impl.js';
import { createAbsenceRecordRepository, createHolidayRepository, createWorkSessionRepository } from '../src/attendance/repository.impl.js';
import { createHrEventBus } from '../src/events/index.js';
import { OpenWorkSessionExistsError, WorkSessionAlreadyClosedError, WorkSessionNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const EMPLOYEE = 'employee-1';

function setup(eventBus = createHrEventBus()) {
  const workSessionRepository = createWorkSessionRepository();
  const absenceRepository = createAbsenceRecordRepository();
  const holidayRepository = createHolidayRepository();
  const engine = createAttendanceEngine(workSessionRepository, absenceRepository, holidayRepository, eventBus);
  return { workSessionRepository, absenceRepository, holidayRepository, engine, eventBus };
}

describe('computeSessionDurationMinutes (pure)', () => {
  it('computes whole minutes between clock-in and clock-out', () => {
    expect(computeSessionDurationMinutes('2026-01-01T09:00:00.000Z', '2026-01-01T17:00:00.000Z')).toBe(480);
  });

  it('never goes negative', () => {
    expect(computeSessionDurationMinutes('2026-01-01T17:00:00.000Z', '2026-01-01T09:00:00.000Z')).toBe(0);
  });
});

describe('computeOvertimeMinutes (pure)', () => {
  it('is 0 for a standard 8-hour day', () => {
    expect(computeOvertimeMinutes(STANDARD_WORK_MINUTES_PER_DAY)).toBe(0);
  });

  it('computes minutes beyond the standard day', () => {
    expect(computeOvertimeMinutes(540)).toBe(60);
  });

  it('never goes negative for a short day', () => {
    expect(computeOvertimeMinutes(200)).toBe(0);
  });

  it('supports a custom standard length', () => {
    expect(computeOvertimeMinutes(300, 240)).toBe(60);
  });
});

describe('computeLateMinutes (pure)', () => {
  it('is 0 with no scheduled start', () => {
    expect(computeLateMinutes('2026-01-01T09:15:00.000Z', undefined)).toBe(0);
  });

  it('computes minutes late relative to the schedule', () => {
    expect(computeLateMinutes('2026-01-01T09:15:00.000Z', '2026-01-01T09:00:00.000Z')).toBe(15);
  });

  it('is 0 when on time or early', () => {
    expect(computeLateMinutes('2026-01-01T08:55:00.000Z', '2026-01-01T09:00:00.000Z')).toBe(0);
  });
});

describe('AttendanceEngine — clockIn/clockOut', () => {
  it('clockIn() opens a session', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE, { at: '2026-01-01T09:00:00.000Z' });
    expect(session.status).toBe('open');
    expect(session.clockInAt).toBe('2026-01-01T09:00:00.000Z');
  });

  it('clockIn() throws OpenWorkSessionExistsError if already clocked in', async () => {
    const { engine } = setup();
    await engine.clockIn(ORG, EMPLOYEE);
    await expect(engine.clockIn(ORG, EMPLOYEE)).rejects.toBeInstanceOf(OpenWorkSessionExistsError);
  });

  it('clockOut() closes the session and computes duration/overtime', async () => {
    const eventBus = createHrEventBus();
    const { engine } = setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('attendance.recorded', (payload) => (seen = payload));
    const session = await engine.clockIn(ORG, EMPLOYEE, { at: '2026-01-01T09:00:00.000Z' });
    const closed = await engine.clockOut(ORG, session.id, { at: '2026-01-01T18:00:00.000Z' });
    expect(closed.status).toBe('closed');
    expect(closed.durationMinutes).toBe(540);
    expect(closed.overtimeMinutes).toBe(60);
    expect(seen).toEqual({ organizationId: ORG, employeeId: EMPLOYEE, workSessionId: session.id, durationMinutes: 540 });
  });

  it('clockOut() computes lateMinutes when a scheduledStartAt was given', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE, { at: '2026-01-01T09:20:00.000Z', scheduledStartAt: '2026-01-01T09:00:00.000Z' });
    const closed = await engine.clockOut(ORG, session.id, { at: '2026-01-01T17:20:00.000Z' });
    expect(closed.lateMinutes).toBe(20);
  });

  it('clockOut() throws WorkSessionNotFoundError for an unknown session', async () => {
    const { engine } = setup();
    await expect(engine.clockOut(ORG, 'missing')).rejects.toBeInstanceOf(WorkSessionNotFoundError);
  });

  it('clockOut() throws WorkSessionAlreadyClosedError for an already-closed session', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE);
    await engine.clockOut(ORG, session.id);
    await expect(engine.clockOut(ORG, session.id)).rejects.toBeInstanceOf(WorkSessionAlreadyClosedError);
  });

  it('allows a new clockIn after the previous session is closed', async () => {
    const { engine } = setup();
    const first = await engine.clockIn(ORG, EMPLOYEE);
    await engine.clockOut(ORG, first.id);
    const second = await engine.clockIn(ORG, EMPLOYEE);
    expect(second.status).toBe('open');
  });

  it('getOpenSession() returns the currently open session', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE);
    expect((await engine.getOpenSession(ORG, EMPLOYEE))?.id).toBe(session.id);
  });

  it('getOpenSession() returns null once closed', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE);
    await engine.clockOut(ORG, session.id);
    expect(await engine.getOpenSession(ORG, EMPLOYEE)).toBeNull();
  });

  it('listSessions() and findByEmployee() round-trip', async () => {
    const { engine } = setup();
    await engine.clockIn(ORG, EMPLOYEE);
    expect(await engine.listSessions(ORG)).toHaveLength(1);
    expect(await engine.findByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
  });
});

describe('AttendanceEngine — absences', () => {
  it('recordAbsence() creates an absence record', async () => {
    const { engine } = setup();
    const record = await engine.recordAbsence(ORG, EMPLOYEE, { date: '2026-01-05', reason: 'sick' });
    expect(record.date).toBe('2026-01-05');
    expect(record.reason).toBe('sick');
  });

  it('listAbsences() and findAbsencesByEmployee() round-trip', async () => {
    const { engine } = setup();
    await engine.recordAbsence(ORG, EMPLOYEE, { date: '2026-01-05' });
    expect(await engine.listAbsences(ORG)).toHaveLength(1);
    expect(await engine.findAbsencesByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
  });
});

describe('AttendanceEngine — holidays are organization-scoped', () => {
  it('a holiday registered for one organization does not apply to another', async () => {
    const { engine } = setup();
    await engine.registerHoliday(ORG, { date: '2026-01-01', name: "New Year's Day" });
    expect(await engine.isHoliday('org-2', '2026-01-01')).toBe(false);
  });
});

describe('AttendanceEngine — holidays', () => {
  it('registerHoliday() and isHoliday() round-trip', async () => {
    const { engine } = setup();
    await engine.registerHoliday(ORG, { date: '2026-01-01', name: "New Year's Day" });
    expect(await engine.isHoliday(ORG, '2026-01-01')).toBe(true);
    expect(await engine.isHoliday(ORG, '2026-01-02')).toBe(false);
  });

  it('listHolidays() and getHoliday() round-trip', async () => {
    const { engine } = setup();
    const holiday = await engine.registerHoliday(ORG, { date: '2026-01-01', name: "New Year's Day" });
    expect(await engine.listHolidays(ORG)).toHaveLength(1);
    expect(await engine.getHoliday(ORG, holiday.id)).toEqual(holiday);
  });
});

describe('AttendanceEngine — overtime and lateness combined', () => {
  it('a session can be both late and have overtime', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE, { at: '2026-01-01T09:30:00.000Z', scheduledStartAt: '2026-01-01T09:00:00.000Z' });
    const closed = await engine.clockOut(ORG, session.id, { at: '2026-01-01T19:00:00.000Z' });
    expect(closed.lateMinutes).toBe(30);
    expect(closed.overtimeMinutes).toBeGreaterThan(0);
  });

  it('a short day has 0 overtime and 0 lateness when on schedule', async () => {
    const { engine } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE, { at: '2026-01-01T09:00:00.000Z', scheduledStartAt: '2026-01-01T09:00:00.000Z' });
    const closed = await engine.clockOut(ORG, session.id, { at: '2026-01-01T13:00:00.000Z' });
    expect(closed.lateMinutes).toBe(0);
    expect(closed.overtimeMinutes).toBe(0);
  });
});

describe('AttendanceEngine — multiple employees', () => {
  it('tracks open sessions independently per employee', async () => {
    const { engine } = setup();
    const sessionA = await engine.clockIn(ORG, 'employee-a');
    const sessionB = await engine.clockIn(ORG, 'employee-b');
    expect(sessionA.employeeId).toBe('employee-a');
    expect(sessionB.employeeId).toBe('employee-b');
    expect(await engine.getOpenSession(ORG, 'employee-a')).not.toBeNull();
    expect(await engine.getOpenSession(ORG, 'employee-b')).not.toBeNull();
  });

  it('closing one employee session does not affect another', async () => {
    const { engine } = setup();
    const sessionA = await engine.clockIn(ORG, 'employee-a');
    await engine.clockIn(ORG, 'employee-b');
    await engine.clockOut(ORG, sessionA.id);
    expect(await engine.getOpenSession(ORG, 'employee-a')).toBeNull();
    expect(await engine.getOpenSession(ORG, 'employee-b')).not.toBeNull();
  });
});

describe('AttendanceEngine — org scoping', () => {
  it('sessions are organization-scoped', async () => {
    const { engine, workSessionRepository } = setup();
    const session = await engine.clockIn(ORG, EMPLOYEE);
    expect(await workSessionRepository.findById('org-2', session.id)).toBeNull();
  });
});
