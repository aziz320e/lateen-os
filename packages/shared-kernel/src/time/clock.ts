/**
 * Clock port — abstracts time access for testability.
 *
 * Implementations live in infrastructure; domain code depends on this port only.
 *
 * @module time/clock
 */

import type { Timestamp } from './timestamp.js';

/** Read-only clock port for obtaining the current domain timestamp. */
export interface Clock {
  now(): Timestamp;
}
