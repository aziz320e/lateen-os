/** @module meeting/value-objects */
import type { EmployeeId } from '../shared/identifiers.js';

/** Meeting attendee reference. */
export interface MeetingAttendee {
  readonly employeeId: EmployeeId;
  readonly role?: string;
}

/** Topic discussed in a meeting. */
export interface MeetingTopic {
  readonly title: string;
  readonly summary?: string;
}
