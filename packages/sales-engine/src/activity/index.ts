/**
 * Sales Activities — real logging of meetings, calls, emails, demos, and
 * follow-ups in deterministic chronological order.
 * @module activity
 */
export * from './types.js';
export * from './repository.js';
export { createSalesActivityRepository } from './repository.impl.js';
export { createSalesActivityTimeline, type SalesActivityTimeline, type LogSalesActivityInput } from './timeline.impl.js';
