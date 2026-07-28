/** @module feedback/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { FeedbackEntryId } from '../shared/identifiers.js';

export type { FeedbackEntryId };

export type FeedbackType = 'nps' | 'csat' | 'survey';

/** A single feedback entry — an NPS/CSAT score or a named survey response. */
export interface FeedbackEntry extends TenantAuditableEntity<FeedbackEntryId> {
  readonly customerId: string;
  readonly feedbackType: FeedbackType;
  /** For `nps`: 0–10. For `csat`: 1–5. Optional for a free-text `survey` entry. */
  readonly score?: number;
  readonly comment?: string;
  readonly surveyName?: string;
}
