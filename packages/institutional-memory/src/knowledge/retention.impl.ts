/**
 * Real Retention Engine — archive rules (retentionPolicy.archiveAfterDays),
 * expiration rules (expiresAt), review scheduling (reviewDueAt), and
 * cleanup recommendations. `recommendCleanup` is a pure read-only dry run;
 * `applyRetentionRules` performs the actual guarded lifecycle transitions.
 *
 * @module knowledge/retention.impl
 */
import type { InstitutionalMemoryEventBus } from '../events/institutional-memory-event-bus.js';
import { nowIso } from '../shared/id.js';
import type { KnowledgeEntryId, OrganizationId } from '../shared/identifiers.js';
import type { KnowledgeLifecycle } from './lifecycle.impl.js';
import type { KnowledgeEntryRepository } from './repository.js';
import type { KnowledgeEntry } from './types.js';

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000;
}

export interface CleanupRecommendation {
  readonly toArchive: readonly KnowledgeEntry[];
  readonly toReview: readonly KnowledgeEntry[];
  readonly toExpire: readonly KnowledgeEntry[];
}

export interface RetentionRunResult {
  readonly archived: readonly KnowledgeEntryId[];
  readonly expired: readonly KnowledgeEntryId[];
  readonly reviewRequested: readonly KnowledgeEntryId[];
}

export interface RetentionEngine {
  findDueForReview(organizationId: OrganizationId, at?: string): Promise<readonly KnowledgeEntry[]>;
  findExpiring(organizationId: OrganizationId, withinDays: number, at?: string): Promise<readonly KnowledgeEntry[]>;
  findExpired(organizationId: OrganizationId, at?: string): Promise<readonly KnowledgeEntry[]>;
  recommendCleanup(organizationId: OrganizationId, at?: string): Promise<CleanupRecommendation>;
  applyRetentionRules(organizationId: OrganizationId, at?: string): Promise<RetentionRunResult>;
}

/** Creates a real {@link RetentionEngine} over a {@link KnowledgeEntryRepository} and {@link KnowledgeLifecycle}. */
export function createRetentionEngine(
  repository: KnowledgeEntryRepository,
  lifecycle: KnowledgeLifecycle,
  eventBus?: InstitutionalMemoryEventBus,
  now: () => string = nowIso,
): RetentionEngine {
  async function findDueForReview(organizationId: OrganizationId, at: string = now()): Promise<readonly KnowledgeEntry[]> {
    const published = await repository.findByStatus(organizationId, 'published');
    return published.filter((entry) => entry.reviewDueAt !== undefined && entry.reviewDueAt <= at);
  }

  async function findExpired(organizationId: OrganizationId, at: string = now()): Promise<readonly KnowledgeEntry[]> {
    const all = await repository.findByOrganization(organizationId);
    return all.filter((entry) => entry.expiresAt !== undefined && entry.expiresAt <= at && entry.status !== 'archived');
  }

  async function recommendCleanup(organizationId: OrganizationId, at: string = now()): Promise<CleanupRecommendation> {
    const toExpire = await findExpired(organizationId, at);
    const expiringIds = new Set(toExpire.map((entry) => entry.id));

    const all = await repository.findByOrganization(organizationId);
    const toArchive = all.filter(
      (entry) =>
        !expiringIds.has(entry.id) &&
        entry.status !== 'archived' &&
        entry.retentionPolicy?.archiveAfterDays !== undefined &&
        daysBetween(entry.updatedAt, at) >= entry.retentionPolicy.archiveAfterDays,
    );

    const toReview = await findDueForReview(organizationId, at);

    return { toArchive, toReview, toExpire };
  }

  return {
    findDueForReview,
    async findExpiring(organizationId, withinDays, at = now()) {
      const all = await repository.findByOrganization(organizationId);
      return all.filter(
        (entry) =>
          entry.expiresAt !== undefined &&
          entry.status !== 'archived' &&
          entry.expiresAt > at &&
          daysBetween(at, entry.expiresAt) <= withinDays,
      );
    },
    findExpired,
    recommendCleanup,

    async applyRetentionRules(organizationId, at = now()) {
      const recommendation = await recommendCleanup(organizationId, at);

      const expired: KnowledgeEntryId[] = [];
      for (const entry of recommendation.toExpire) {
        eventBus?.publish('knowledge.expired', { knowledgeEntryId: entry.id, organizationId });
        await lifecycle.archive(organizationId, entry.id);
        expired.push(entry.id);
      }

      const archived: KnowledgeEntryId[] = [];
      for (const entry of recommendation.toArchive) {
        await lifecycle.archive(organizationId, entry.id);
        archived.push(entry.id);
      }

      const reviewRequested: KnowledgeEntryId[] = [];
      for (const entry of recommendation.toReview) {
        await lifecycle.requestReview(organizationId, entry.id, 'scheduled review');
        reviewRequested.push(entry.id);
      }

      return { archived, expired, reviewRequested };
    },
  };
}
