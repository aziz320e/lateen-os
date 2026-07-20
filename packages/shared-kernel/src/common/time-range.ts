/**
 * Time range value object.
 *
 * @module common/time-range
 */

import type { Timestamp } from '../time/timestamp.js';

/** Closed or half-open interval between two timestamps. */
export interface TimeRange {
  readonly start: Timestamp;
  readonly end: Timestamp;
}
