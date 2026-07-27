import { describe, expect, it } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';
import { createKnowledgeValidationEngine } from '../src/knowledge/validation.impl.js';

const ORG = 'org-1';

function setup(now?: () => string) {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
  const validation = createKnowledgeValidationEngine(repository, now);
  return { repository, lifecycle, validation };
}

describe('createKnowledgeValidationEngine', () => {
  it('detectDuplicates() flags an exact normalized-title match', async () => {
    const { lifecycle, validation } = setup();
    await lifecycle.create(ORG, { title: 'Refund Policy', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    const duplicates = await validation.detectDuplicates(ORG, '  refund   policy  ');
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.reason).toBe('exact_title');
    expect(duplicates[0]?.similarity).toBe(1);
  });

  it('detectDuplicates() flags high content similarity by Jaccard overlap', async () => {
    const { lifecycle, validation } = setup();
    await lifecycle.create(ORG, {
      title: 'Original',
      content: 'the quick brown fox jumps over the lazy dog',
      knowledgeType: 'best_practice',
      category: 'general',
      source: 'ops',
    });
    const duplicates = await validation.detectDuplicates(ORG, 'Different title', 'the quick brown fox jumps over the lazy dog today');
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.reason).toBe('similar_content');
    expect(duplicates[0]?.similarity).toBeGreaterThanOrEqual(0.8);
  });

  it('detectDuplicates() does not flag dissimilar content', async () => {
    const { lifecycle, validation } = setup();
    await lifecycle.create(ORG, { title: 'Original', content: 'alpha beta gamma', knowledgeType: 'best_practice', category: 'general', source: 'ops' });
    const duplicates = await validation.detectDuplicates(ORG, 'Different', 'completely unrelated words here');
    expect(duplicates).toHaveLength(0);
  });

  it('detectStale() flags published entries past the threshold', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await lifecycle.transition(ORG, entry.id, 'published');

    const at = new Date(Date.parse(entry.updatedAt) + 200 * 86_400_000).toISOString();
    const stale = await validation.detectStale(ORG, 180, at);
    expect(stale.map((e) => e.id)).toEqual([entry.id]);

    const notYetStale = await validation.detectStale(ORG, 365, at);
    expect(notYetStale).toHaveLength(0);
  });

  it('detectStale() ignores drafts', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    const at = new Date(Date.parse(entry.updatedAt) + 400 * 86_400_000).toISOString();
    expect(await validation.detectStale(ORG, 180, at)).toHaveLength(0);
  });

  it('validateOwnership() requires an ownerId for private/restricted visibility', async () => {
    const { lifecycle, validation } = setup();
    const withoutOwner = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'documentation',
      category: 'general',
      source: 'wiki',
      visibility: 'restricted',
    });
    const result = validation.validateOwnership(withoutOwner);
    expect(result.ok).toBe(false);

    const withOwner = { ...withoutOwner, ownerId: 'employee-1' };
    expect(validation.validateOwnership(withOwner).ok).toBe(true);
  });

  it('validateOwnership() passes for organization visibility without an owner', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    expect(validation.validateOwnership(entry).ok).toBe(true);
  });

  it('checkExpiration() flags entries whose expiresAt has passed and are not archived', async () => {
    const { lifecycle, validation } = setup();
    const at = '2026-06-01T00:00:00.000Z';
    const expired = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-01-01T00:00:00.000Z',
    });
    const notExpired = await lifecycle.create(ORG, {
      title: 'B',
      content: 'b',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2027-01-01T00:00:00.000Z',
    });
    const results = await validation.checkExpiration(ORG, at);
    expect(results.map((e) => e.id)).toEqual([expired.id]);
    expect(results.map((e) => e.id)).not.toContain(notExpired.id);
  });

  it('checkExpiration() excludes already-archived entries', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2020-01-01T00:00:00.000Z',
    });
    await lifecycle.archive(ORG, entry.id);
    expect(await validation.checkExpiration(ORG, '2026-01-01T00:00:00.000Z')).toHaveLength(0);
  });

  it('is organization-scoped', async () => {
    const { lifecycle, validation } = setup();
    await lifecycle.create(ORG, { title: 'Refund Policy', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    expect(await validation.detectDuplicates('org-2', 'Refund Policy')).toHaveLength(0);
  });

  it('detectDuplicates() still flags an archived entry with a matching title', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, { title: 'Legacy Policy', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    await lifecycle.archive(ORG, entry.id);
    const duplicates = await validation.detectDuplicates(ORG, 'Legacy Policy');
    expect(duplicates.map((d) => d.entry.id)).toEqual([entry.id]);
  });

  it('detectStale() does not flag an entry exactly at the boundary before it elapses', async () => {
    const { lifecycle, validation } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await lifecycle.transition(ORG, entry.id, 'published');
    const justBefore = new Date(Date.parse(entry.updatedAt) + 179 * 86_400_000).toISOString();
    expect(await validation.detectStale(ORG, 180, justBefore)).toHaveLength(0);
  });

  it('detectDuplicates() ranks exact title matches above similar-content matches', async () => {
    const { lifecycle, validation } = setup();
    await lifecycle.create(ORG, { title: 'Shared Title', content: 'alpha beta gamma delta', knowledgeType: 'best_practice', category: 'general', source: 'ops' });
    await lifecycle.create(ORG, { title: 'Different Title', content: 'alpha beta gamma delta epsilon', knowledgeType: 'best_practice', category: 'general', source: 'ops' });

    const duplicates = await validation.detectDuplicates(ORG, 'Shared Title', 'alpha beta gamma delta epsilon');
    expect(duplicates[0]?.reason).toBe('exact_title');
    expect(duplicates[0]?.similarity).toBe(1);
  });
});
