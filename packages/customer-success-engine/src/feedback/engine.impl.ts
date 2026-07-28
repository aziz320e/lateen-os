/**
 * Real Feedback engine — NPS, CSAT, and named surveys, with
 * deterministic aggregate scoring and full history per customer.
 *
 * @module feedback/engine.impl
 */
import type { CustomerSuccessEventBus } from '../events/customer-success-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { FeedbackEntryId, OrganizationId } from '../shared/identifiers.js';
import type { FeedbackEntryRepository } from './repository.js';
import type { FeedbackEntry, FeedbackType } from './types.js';

export type NpsCategory = 'promoter' | 'passive' | 'detractor';

/** Fixed NPS categorization: 9–10 promoter, 7–8 passive, 0–6 detractor. */
export function computeNpsCategory(score: number): NpsCategory {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

/** Standard NPS formula — `%promoters - %detractors`, rounded to the nearest whole point. `0` for an empty list. */
export function computeNpsScore(npsEntries: readonly FeedbackEntry[]): number {
  const scored = npsEntries.filter((entry): entry is FeedbackEntry & { score: number } => entry.feedbackType === 'nps' && entry.score !== undefined);
  if (scored.length === 0) return 0;
  const promoters = scored.filter((entry) => computeNpsCategory(entry.score) === 'promoter').length;
  const detractors = scored.filter((entry) => computeNpsCategory(entry.score) === 'detractor').length;
  return Math.round(((promoters - detractors) / scored.length) * 100);
}

/** Average CSAT score, rounded to 2 decimal places. `0` for an empty list. */
export function computeAverageCsat(csatEntries: readonly FeedbackEntry[]): number {
  const scored = csatEntries.filter((entry): entry is FeedbackEntry & { score: number } => entry.feedbackType === 'csat' && entry.score !== undefined);
  if (scored.length === 0) return 0;
  const total = scored.reduce((sum, entry) => sum + entry.score, 0);
  return Math.round((total / scored.length) * 100) / 100;
}

export interface RecordFeedbackInput {
  readonly customerId: string;
  readonly feedbackType: FeedbackType;
  readonly score?: number;
  readonly comment?: string;
  readonly surveyName?: string;
}

export interface FeedbackEngine {
  recordFeedback(organizationId: OrganizationId, input: RecordFeedbackInput): Promise<FeedbackEntry>;
  get(organizationId: OrganizationId, feedbackEntryId: FeedbackEntryId): Promise<FeedbackEntry | null>;
  list(organizationId: OrganizationId): Promise<readonly FeedbackEntry[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly FeedbackEntry[]>;
  findByType(organizationId: OrganizationId, feedbackType: FeedbackType): Promise<readonly FeedbackEntry[]>;
  /** Chronological feedback history for one customer, oldest first. */
  getHistory(organizationId: OrganizationId, customerId: string): Promise<readonly FeedbackEntry[]>;
  computeNpsForCustomer(organizationId: OrganizationId, customerId: string): Promise<number>;
  computeCsatForCustomer(organizationId: OrganizationId, customerId: string): Promise<number>;
}

/** Creates a real {@link FeedbackEngine}. */
export function createFeedbackEngine(
  repository: FeedbackEntryRepository,
  eventBus?: CustomerSuccessEventBus,
  now: () => string = nowIso,
): FeedbackEngine {
  return {
    async recordFeedback(organizationId, input) {
      const timestamp = now();
      const entry: FeedbackEntry = {
        id: generateId('feedback-entry'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        customerId: input.customerId,
        feedbackType: input.feedbackType,
        score: input.score,
        comment: input.comment,
        surveyName: input.surveyName,
      };
      await repository.save(entry);
      eventBus?.publish('feedback.received', { organizationId, feedbackEntryId: entry.id, customerId: entry.customerId, feedbackType: entry.feedbackType });
      return entry;
    },

    async get(organizationId, feedbackEntryId) {
      return repository.findById(organizationId, feedbackEntryId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByCustomer(organizationId, customerId) {
      return repository.findByCustomer(organizationId, customerId);
    },

    async findByType(organizationId, feedbackType) {
      return repository.findByType(organizationId, feedbackType);
    },

    async getHistory(organizationId, customerId) {
      const entries = await repository.findByCustomer(organizationId, customerId);
      return [...entries].sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
    },

    async computeNpsForCustomer(organizationId, customerId) {
      const entries = await repository.findByCustomer(organizationId, customerId);
      return computeNpsScore(entries);
    },

    async computeCsatForCustomer(organizationId, customerId) {
      const entries = await repository.findByCustomer(organizationId, customerId);
      return computeAverageCsat(entries);
    },
  };
}
