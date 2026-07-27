import { describe, expect, it, vi } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';
import { createRetentionEngine } from '../src/knowledge/retention.impl.js';
import { createInstitutionalMemoryEventBus } from '../src/events/institutional-memory-event-bus.js';

const ORG = 'org-1';
const T0 = '2026-01-01T00:00:00.000Z';

function setup(eventBus = createInstitutionalMemoryEventBus()) {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository, eventBus, () => T0);
  const retention = createRetentionEngine(repository, lifecycle, eventBus, () => T0);
  return { repository, lifecycle, retention, eventBus };
}

describe('createRetentionEngine', () => {
  it('findDueForReview() returns published entries whose reviewDueAt has passed', async () => {
    const { lifecycle, retention } = setup();
    const due = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      reviewDueAt: '2025-12-01T00:00:00.000Z',
    });
    await lifecycle.transition(ORG, due.id, 'published');
    const notDue = await lifecycle.create(ORG, {
      title: 'B',
      content: 'b',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      reviewDueAt: '2027-01-01T00:00:00.000Z',
    });
    await lifecycle.transition(ORG, notDue.id, 'published');

    const results = await retention.findDueForReview(ORG, T0);
    expect(results.map((e) => e.id)).toEqual([due.id]);
  });

  it('findExpiring() returns entries expiring within the window but not yet expired', async () => {
    const { lifecycle, retention } = setup();
    const soon = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-01-05T00:00:00.000Z',
    });
    const later = await lifecycle.create(ORG, {
      title: 'B',
      content: 'b',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-06-01T00:00:00.000Z',
    });

    const results = await retention.findExpiring(ORG, 10, T0);
    expect(results.map((e) => e.id)).toEqual([soon.id]);
    expect(results.map((e) => e.id)).not.toContain(later.id);
  });

  it('findExpired() returns entries whose expiresAt has already passed', async () => {
    const { lifecycle, retention } = setup();
    const expired = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2025-01-01T00:00:00.000Z',
    });
    const results = await retention.findExpired(ORG, T0);
    expect(results.map((e) => e.id)).toEqual([expired.id]);
  });

  it('recommendCleanup() is a pure read-only dry run that does not mutate state', async () => {
    const { lifecycle, retention } = setup();
    const expired = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2025-01-01T00:00:00.000Z',
    });
    const recommendation = await retention.recommendCleanup(ORG, T0);
    expect(recommendation.toExpire.map((e) => e.id)).toEqual([expired.id]);

    const reloaded = await lifecycle.get(ORG, expired.id);
    expect(reloaded?.status).toBe('draft');
  });

  it('recommendCleanup() separates archiveAfterDays candidates from expired candidates', async () => {
    const { lifecycle, retention } = setup();
    const oldEntry = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'best_practice',
      category: 'general',
      source: 'ops',
      retentionPolicy: { archiveAfterDays: 30 },
    });
    await lifecycle.transition(ORG, oldEntry.id, 'published');

    const at = new Date(Date.parse(T0) + 45 * 86_400_000).toISOString();
    const recommendation = await retention.recommendCleanup(ORG, at);
    expect(recommendation.toArchive.map((e) => e.id)).toEqual([oldEntry.id]);
    expect(recommendation.toExpire).toHaveLength(0);
  });

  it('applyRetentionRules() archives expired entries and publishes knowledge.expired then knowledge.archived', async () => {
    const eventBus = createInstitutionalMemoryEventBus();
    const expiredHandler = vi.fn();
    const archivedHandler = vi.fn();
    const events: string[] = [];
    eventBus.subscribe('knowledge.expired', (...args) => {
      expiredHandler(...args);
      events.push('expired');
    });
    eventBus.subscribe('knowledge.archived', (...args) => {
      archivedHandler(...args);
      events.push('archived');
    });

    const { lifecycle, retention } = setup(eventBus);
    const expired = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2025-01-01T00:00:00.000Z',
    });

    const result = await retention.applyRetentionRules(ORG, T0);
    await Promise.resolve();

    expect(result.expired).toEqual([expired.id]);
    expect(events).toEqual(['expired', 'archived']);
    const reloaded = await lifecycle.get(ORG, expired.id);
    expect(reloaded?.status).toBe('archived');
  });

  it('applyRetentionRules() archives retention-policy candidates', async () => {
    const { lifecycle, retention } = setup();
    const oldEntry = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'best_practice',
      category: 'general',
      source: 'ops',
      retentionPolicy: { archiveAfterDays: 30 },
    });
    await lifecycle.transition(ORG, oldEntry.id, 'published');

    const at = new Date(Date.parse(T0) + 45 * 86_400_000).toISOString();
    const result = await retention.applyRetentionRules(ORG, at);
    expect(result.archived).toEqual([oldEntry.id]);
    const reloaded = await lifecycle.get(ORG, oldEntry.id);
    expect(reloaded?.status).toBe('archived');
  });

  it('applyRetentionRules() requests review for entries past reviewDueAt', async () => {
    const { lifecycle, retention } = setup();
    const due = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      reviewDueAt: '2025-12-01T00:00:00.000Z',
    });
    await lifecycle.transition(ORG, due.id, 'published');

    const result = await retention.applyRetentionRules(ORG, T0);
    expect(result.reviewRequested).toEqual([due.id]);
    const reloaded = await lifecycle.get(ORG, due.id);
    expect(reloaded?.status).toBe('review');
  });

  it('applyRetentionRules() is a no-op when nothing is due', async () => {
    const { lifecycle, retention } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    const result = await retention.applyRetentionRules(ORG, T0);
    expect(result).toEqual({ archived: [], expired: [], reviewRequested: [] });
  });

  it('is organization-scoped', async () => {
    const { lifecycle, retention } = setup();
    await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2025-01-01T00:00:00.000Z',
    });
    expect(await retention.findExpired('org-2', T0)).toHaveLength(0);
  });

  it('findExpiring() excludes already-archived entries', async () => {
    const { lifecycle, retention } = setup();
    const entry = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-01-05T00:00:00.000Z',
    });
    await lifecycle.archive(ORG, entry.id);
    expect(await retention.findExpiring(ORG, 30, T0)).toHaveLength(0);
  });

  it('findDueForReview() ignores draft entries even with a past reviewDueAt', async () => {
    const { lifecycle, retention } = setup();
    await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      reviewDueAt: '2025-01-01T00:00:00.000Z',
    });
    expect(await retention.findDueForReview(ORG, T0)).toHaveLength(0);
  });
});
