import { describe, expect, it } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';
import { createKnowledgeSearchEngine } from '../src/knowledge/search.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
  const search = createKnowledgeSearchEngine(repository);
  return { repository, lifecycle, search };
}

describe('createKnowledgeSearchEngine', () => {
  it('ranks a title match above a content-only match', async () => {
    const { lifecycle, search } = setup();
    const titleMatch = await lifecycle.create(ORG, {
      title: 'Refund policy',
      content: 'General customer service guidance.',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
    });
    const contentMatch = await lifecycle.create(ORG, {
      title: 'Customer service guide',
      content: 'Includes a refund process for edge cases.',
      knowledgeType: 'sop',
      category: 'process',
      source: 'ops',
    });

    const results = await search.search(ORG, { keyword: 'refund' });
    expect(results.map((r) => r.entry.id)).toEqual([titleMatch.id, contentMatch.id]);
    expect(results[0]!.score).toBeGreaterThan(results[1]!.score);
  });

  it('excludes entries with a zero score when a keyword is given', async () => {
    const { lifecycle, search } = setup();
    await lifecycle.create(ORG, { title: 'Unrelated', content: 'nothing matches here', knowledgeType: 'faq', category: 'general', source: 'support' });
    const results = await search.search(ORG, { keyword: 'refund' });
    expect(results).toHaveLength(0);
  });

  it('returns everything with score 1 when no keyword is given', async () => {
    const { lifecycle, search } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await lifecycle.create(ORG, { title: 'B', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });
    const results = await search.search(ORG, {});
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.score === 1)).toBe(true);
  });

  it('filters by tags, category, source, knowledgeType, and status', async () => {
    const { lifecycle, search } = setup();
    const match = await lifecycle.create(ORG, {
      title: 'Onboarding playbook',
      content: 'Steps for onboarding',
      knowledgeType: 'playbook',
      category: 'operational',
      source: 'hr',
      tags: ['onboarding'],
    });
    await lifecycle.create(ORG, {
      title: 'Offboarding playbook',
      content: 'Steps for offboarding',
      knowledgeType: 'playbook',
      category: 'operational',
      source: 'hr',
      tags: ['offboarding'],
    });

    const byTag = await search.search(ORG, { tags: ['onboarding'] });
    expect(byTag.map((r) => r.entry.id)).toEqual([match.id]);

    const byCategory = await search.search(ORG, { category: 'operational' });
    expect(byCategory).toHaveLength(2);

    const bySource = await search.search(ORG, { source: 'hr' });
    expect(bySource).toHaveLength(2);

    const byType = await search.search(ORG, { knowledgeType: 'playbook' });
    expect(byType).toHaveLength(2);

    const byStatus = await search.search(ORG, { status: 'draft' });
    expect(byStatus).toHaveLength(2);
  });

  it('respects the limit parameter', async () => {
    const { lifecycle, search } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await lifecycle.create(ORG, { title: 'B', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });
    const results = await search.search(ORG, { limit: 1 });
    expect(results).toHaveLength(1);
  });

  it('is deterministic: repeated calls return the same order', async () => {
    const { lifecycle, search } = setup();
    await lifecycle.create(ORG, { title: 'Refund policy one', content: 'refund refund', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    await lifecycle.create(ORG, { title: 'Refund policy two', content: 'refund refund', knowledgeType: 'policy', category: 'compliance', source: 'legal' });

    const first = await search.search(ORG, { keyword: 'refund' });
    const second = await search.search(ORG, { keyword: 'refund' });
    expect(first.map((r) => r.entry.id)).toEqual(second.map((r) => r.entry.id));
  });

  it('is organization-scoped', async () => {
    const { lifecycle, search } = setup();
    await lifecycle.create(ORG, { title: 'Refund policy', content: 'refund', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    const results = await search.search('org-2', { keyword: 'refund' });
    expect(results).toHaveLength(0);
  });

  it('matches keywords case-insensitively', async () => {
    const { lifecycle, search } = setup();
    const entry = await lifecycle.create(ORG, { title: 'REFUND Policy', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    const results = await search.search(ORG, { keyword: 'refund' });
    expect(results.map((r) => r.entry.id)).toEqual([entry.id]);
  });

  it('scores an exact tag match higher than a plain content mention', async () => {
    const { lifecycle, search } = setup();
    const tagged = await lifecycle.create(ORG, {
      title: 'Guide',
      content: 'General guidance',
      knowledgeType: 'faq',
      category: 'general',
      source: 'support',
      tags: ['onboarding'],
    });
    const mentioned = await lifecycle.create(ORG, {
      title: 'Other guide',
      content: 'onboarding is discussed briefly',
      knowledgeType: 'faq',
      category: 'general',
      source: 'support',
    });
    const results = await search.search(ORG, { keyword: 'onboarding' });
    const taggedScore = results.find((r) => r.entry.id === tagged.id)?.score ?? 0;
    const mentionedScore = results.find((r) => r.entry.id === mentioned.id)?.score ?? 0;
    expect(taggedScore).toBeGreaterThan(mentionedScore);
  });
});
