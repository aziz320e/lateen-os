/**
 * Deterministic calendar-date arithmetic, shared by modules that
 * compute retention/expiry windows.
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
  return new Date(ms).toISOString().slice(0, 10);
}
