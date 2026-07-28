/**
 * Deterministic calendar-date arithmetic, shared by modules that need
 * date range filtering (Movements, Valuation, Counting).
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
