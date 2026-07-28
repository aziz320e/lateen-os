/**
 * Deterministic calendar-date arithmetic over `YYYY-MM-DD` strings and
 * ISO date-time strings, shared by Attendance, Leave, Payroll, and
 * Performance.
 *
 * @module shared/date
 */
import type { ISODate, ISODateTime } from './primitives.js';

/** Adds `days` calendar days to an ISO date. */
export function addDaysIso(date: ISODate, days: number): ISODate {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Adds `months` calendar months to an ISO date, clamping the day to the resulting month's length. */
export function addMonthsIso(date: ISODate, months: number): ISODate {
  const parts = date.split('-').map(Number);
  const year = parts[0] ?? 0;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const total = (month - 1) + months;
  const newYear = year + Math.floor(total / 12);
  const newMonth = ((total % 12) + 12) % 12;
  const lastDayOfMonth = new Date(Date.UTC(newYear, newMonth + 1, 0)).getUTCDate();
  const clampedDay = Math.min(day, lastDayOfMonth);
  return `${newYear.toString().padStart(4, '0')}-${(newMonth + 1).toString().padStart(2, '0')}-${clampedDay.toString().padStart(2, '0')}`;
}

/** Whole calendar days elapsed from `from` to `to` (negative if `to` precedes `from`), comparing only the date portion. */
export function daysBetweenIso(from: ISODate, to: ISODate): number {
  const fromMs = new Date(`${from}T00:00:00.000Z`).getTime();
  const toMs = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

/** Whole minutes elapsed from `from` to `to` (negative if `to` precedes `from`), over full ISO date-times. */
export function minutesBetweenIso(from: ISODateTime, to: ISODateTime): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60_000);
}

/** The `YYYY-MM-DD` calendar date portion of an ISO date-time. */
export function dateOnly(dateTime: ISODateTime): ISODate {
  return dateTime.slice(0, 10);
}
