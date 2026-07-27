import { describe, expect, it, vi } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { canTransitionKnowledge, createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';
import { createInstitutionalMemoryEventBus } from '../src/events/institutional-memory-event-bus.js';
import {
  InvalidKnowledgeTransitionError,
  KnowledgeEntryNotFoundError,
  KnowledgeEntryVersionNotFoundError,
} from '../src/shared/errors.js';

const ORG = 'org-1';

function createInput() {
  return {
    title: 'Refund SOP',
    content: 'Step 1: verify order. Step 2: issue refund within 48 hours.',
    knowledgeType: 'sop' as const,
    category: 'process' as const,
    source: 'ops-handbook',
    tags: ['refunds', 'customer-service'],
  };
}

function setup() {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
  return { repository, versionRepository, lifecycle };
}

describe('canTransitionKnowledge', () => {
  it('allows draft -> published -> review -> published', () => {
    expect(canTransitionKnowledge('draft', 'published')).toBe(true);
    expect(canTransitionKnowledge('published', 'review')).toBe(true);
    expect(canTransitionKnowledge('review', 'published')).toBe(true);
  });

  it('allows archived -> draft (restore) but nothing else out of archived', () => {
    expect(canTransitionKnowledge('archived', 'draft')).toBe(true);
    expect(canTransitionKnowledge('archived', 'published')).toBe(false);
    expect(canTransitionKnowledge('archived', 'review')).toBe(false);
  });
});

describe('createKnowledgeLifecycle', () => {
  it('create() creates an entry in draft status with currentVersion 1', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    expect(entry.status).toBe('draft');
    expect(entry.currentVersion).toBe(1);
    expect(entry.relatedKnowledgeEntryIds).toEqual([]);
    expect(entry.referenceIds).toEqual([]);
  });

  it('create() defaults importance/confidence/visibility', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    expect(entry.importance).toBe('medium');
    expect(entry.confidence).toBe('50');
    expect(entry.visibility).toBe('organization');
  });

  it('create() writes the initial immutable version', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, { ...createInput(), authorId: 'employee-1' });
    const history = await lifecycle.getVersionHistory(ORG, entry.id);
    expect(history).toHaveLength(1);
    expect(history[0]?.revisionNumber).toBe(1);
    expect(history[0]?.authorId).toBe('employee-1');
    expect(history[0]?.changeSummary).toBe('Initial version');
  });

  it('update() with content change increments currentVersion and adds a new version', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    const updated = await lifecycle.update(ORG, entry.id, {
      content: 'Step 1: verify order. Step 2: issue refund within 24 hours.',
      authorId: 'employee-2',
      changeSummary: 'Tightened SLA',
    });
    expect(updated.currentVersion).toBe(2);
    const history = await lifecycle.getVersionHistory(ORG, entry.id);
    expect(history).toHaveLength(2);
    expect(history[1]?.content).toContain('24 hours');
    expect(history[1]?.authorId).toBe('employee-2');
  });

  it('update() without content/title change does not create a new version', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    const updated = await lifecycle.update(ORG, entry.id, { tags: ['refunds', 'sla'] });
    expect(updated.currentVersion).toBe(1);
    const history = await lifecycle.getVersionHistory(ORG, entry.id);
    expect(history).toHaveLength(1);
    expect(updated.tags).toEqual(['refunds', 'sla']);
  });

  it('update() rejects an archived entry', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.archive(ORG, entry.id);
    await expect(lifecycle.update(ORG, entry.id, { title: 'New title' })).rejects.toBeInstanceOf(InvalidKnowledgeTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    const archived = await lifecycle.archive(ORG, entry.id);
    expect(archived.status).toBe('archived');
    const restored = await lifecycle.restore(ORG, entry.id);
    expect(restored.status).toBe('draft');
  });

  it('restore() rejects a non-archived entry', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await expect(lifecycle.restore(ORG, entry.id)).rejects.toBeInstanceOf(InvalidKnowledgeTransitionError);
  });

  it('requestReview() transitions to review from draft or published', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    const reviewed = await lifecycle.requestReview(ORG, entry.id, 'quarterly check');
    expect(reviewed.status).toBe('review');

    const published = await lifecycle.transition(ORG, entry.id, 'published');
    const reReviewed = await lifecycle.requestReview(ORG, published.id);
    expect(reReviewed.status).toBe('review');
  });

  it('rollback() restores a prior revision as a new revision (append-only)', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.update(ORG, entry.id, { content: 'v2 content' });
    await lifecycle.update(ORG, entry.id, { content: 'v3 content' });

    const rolledBack = await lifecycle.rollback(ORG, entry.id, 1, 'employee-3');
    expect(rolledBack.content).toBe(createInput().content);
    expect(rolledBack.currentVersion).toBe(4);

    const history = await lifecycle.getVersionHistory(ORG, entry.id);
    expect(history).toHaveLength(4);
    expect(history[3]?.changeSummary).toBe('Rolled back to revision 1');
  });

  it('rollback() throws KnowledgeEntryVersionNotFoundError for an unknown revision', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await expect(lifecycle.rollback(ORG, entry.id, 99)).rejects.toBeInstanceOf(KnowledgeEntryVersionNotFoundError);
  });

  it('rollback() rejects an archived entry', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.archive(ORG, entry.id);
    await expect(lifecycle.rollback(ORG, entry.id, 1)).rejects.toBeInstanceOf(InvalidKnowledgeTransitionError);
  });

  it('throws KnowledgeEntryNotFoundError for an unknown entry', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.archive(ORG, 'missing')).rejects.toBeInstanceOf(KnowledgeEntryNotFoundError);
  });

  it('publishes knowledge.created, updated, archived, restored, version.created, review.required', async () => {
    const eventBus = createInstitutionalMemoryEventBus();
    const created = vi.fn();
    const updated = vi.fn();
    const archived = vi.fn();
    const restored = vi.fn();
    const versionCreated = vi.fn();
    const reviewRequired = vi.fn();
    eventBus.subscribe('knowledge.created', created);
    eventBus.subscribe('knowledge.updated', updated);
    eventBus.subscribe('knowledge.archived', archived);
    eventBus.subscribe('knowledge.restored', restored);
    eventBus.subscribe('knowledge.version.created', versionCreated);
    eventBus.subscribe('knowledge.review.required', reviewRequired);

    const repository = createKnowledgeEntryRepository();
    const versionRepository = createKnowledgeEntryVersionRepository();
    const lifecycle = createKnowledgeLifecycle(repository, versionRepository, eventBus);

    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.update(ORG, entry.id, { content: 'v2' });
    await lifecycle.requestReview(ORG, entry.id);
    await lifecycle.transition(ORG, entry.id, 'published');
    await lifecycle.archive(ORG, entry.id);
    await lifecycle.restore(ORG, entry.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
    expect(archived).toHaveBeenCalledTimes(1);
    expect(restored).toHaveBeenCalledTimes(1);
    expect(versionCreated).toHaveBeenCalledTimes(2);
    expect(reviewRequired).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    expect(await repository.findById('org-2', entry.id)).toBeNull();
  });

  it('transition() throws InvalidKnowledgeTransitionError for a disallowed target status', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.archive(ORG, entry.id);
    await expect(lifecycle.transition(ORG, entry.id, 'published')).rejects.toBeInstanceOf(InvalidKnowledgeTransitionError);
  });

  it('update() preserves ownerId/retentionPolicy/expiresAt/reviewDueAt when not provided', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, {
      ...createInput(),
      ownerId: 'employee-1',
      retentionPolicy: { archiveAfterDays: 90 },
      expiresAt: '2027-01-01T00:00:00.000Z',
      reviewDueAt: '2026-06-01T00:00:00.000Z',
    });
    const updated = await lifecycle.update(ORG, entry.id, { tags: ['new-tag'] });
    expect(updated.ownerId).toBe('employee-1');
    expect(updated.retentionPolicy).toEqual({ archiveAfterDays: 90 });
    expect(updated.expiresAt).toBe('2027-01-01T00:00:00.000Z');
    expect(updated.reviewDueAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('requestReview() rejects an archived entry', async () => {
    const { lifecycle } = setup();
    const entry = await lifecycle.create(ORG, createInput());
    await lifecycle.archive(ORG, entry.id);
    await expect(lifecycle.requestReview(ORG, entry.id)).rejects.toBeInstanceOf(InvalidKnowledgeTransitionError);
  });

  it('getVersionHistory() returns an empty array for a knowledge entry with no revisions recorded elsewhere', async () => {
    const { versionRepository } = setup();
    expect(await versionRepository.findByKnowledgeEntry(ORG, 'unknown-entry')).toEqual([]);
  });
});
