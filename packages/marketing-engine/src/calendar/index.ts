/**
 * Marketing Calendar — deterministic schedules, recurring campaigns, and
 * launch windows.
 * @module calendar
 */
export * from './types.js';
export * from './repository.js';
export { createCalendarRepository } from './repository.impl.js';
export {
  createMarketingCalendarService,
  generateOccurrences,
  type MarketingCalendarService,
  type ScheduleCalendarEntryInput,
  type UpdateCalendarEntryInput,
} from './service.impl.js';
