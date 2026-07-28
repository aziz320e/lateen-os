/**
 * Deterministic calendar-date arithmetic, shared by modules that
 * compute schedules and durations (Scheduling Engine, Time Tracking,
 * Training-style expiries).
 *
 * @module shared/date
 */
import type { ISODate } from './primitives.js';

/** Whole calendar days elapsed from `from` to `to` (negative if `to` precedes `from`). */
export function daysBetweenIso(from: ISODate, to: ISODate): number {
  const fromMs = new Date(`${from}T00:00:00.000Z`).getTime();
  const toMs = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

/** Adds a (possibly negative) whole number of calendar days to an ISO date. */
export function addDaysIso(date: ISODate, days: number): ISODate {
  const ms = new Date(`${date}T00:00:00.000Z`).getTime() + days * 24 * 60 * 60 * 1000;
  const iso = new Date(ms).toISOString();
  return iso.slice(0, 10);
}

/** Minutes elapsed from `from` to `to`, both ISO date-time strings (negative if `to` precedes `from`). */
export function minutesBetweenIso(from: string, to: string): number {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  return Math.round((toMs - fromMs) / (60 * 1000));
}
