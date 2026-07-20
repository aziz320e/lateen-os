/** @module timeline/value-objects */
import type { Timestamp } from '@lateen-os/shared-kernel/time';

/** Bounded time window for timeline queries. */
export interface TimelineWindow {
  readonly start: Timestamp;
  readonly end: Timestamp;
}
