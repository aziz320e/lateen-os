import { describe, expect, it } from 'vitest';
import { createInstitutionalMemoryRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createKnowledgeRuntimeQueries (via createInstitutionalMemoryRuntime)', () => {
  it('findKnowledge() filters by type, status, and category', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const policy = await runtime.lifecycle.create(ORG, {
      title: 'Refund Policy',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
    });
    await runtime.lifecycle.create(ORG, { title: 'FAQ', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });

    const byType = await runtime.queries.findKnowledge({ organizationId: ORG, knowledgeType: 'policy' });
    expect(byType.entries.map((e) => e.id)).toEqual([policy.id]);

    const byCategory = await runtime.queries.findKnowledge({ organizationId: ORG, category: 'compliance' });
    expect(byCategory.entries.map((e) => e.id)).toEqual([policy.id]);

    const all = await runtime.queries.findKnowledge({ organizationId: ORG });
    expect(all.total).toBe(2);
  });

  it('findPolicies/findPlaybooks/findLessonsLearned/findTemplates filter by their fixed knowledgeType', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    await runtime.lifecycle.create(ORG, { title: 'Policy', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    await runtime.lifecycle.create(ORG, { title: 'Playbook', content: 'b', knowledgeType: 'playbook', category: 'operational', source: 'ops' });
    await runtime.lifecycle.create(ORG, { title: 'Lesson', content: 'c', knowledgeType: 'lesson_learned', category: 'general', source: 'retro' });
    await runtime.lifecycle.create(ORG, { title: 'Template', content: 'd', knowledgeType: 'template', category: 'general', source: 'ops' });

    expect((await runtime.queries.findPolicies({ organizationId: ORG })).entries).toHaveLength(1);
    expect((await runtime.queries.findPlaybooks({ organizationId: ORG })).entries).toHaveLength(1);
    expect((await runtime.queries.findLessonsLearned({ organizationId: ORG })).entries).toHaveLength(1);
    expect((await runtime.queries.findTemplates({ organizationId: ORG })).entries).toHaveLength(1);
  });

  it('findRelatedKnowledge() combines related links, parent, and children', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const root = await runtime.lifecycle.create(ORG, { title: 'Root', content: 'a', knowledgeType: 'documentation', category: 'technical', source: 'wiki' });
    const related = await runtime.lifecycle.create(ORG, { title: 'Related', content: 'b', knowledgeType: 'documentation', category: 'technical', source: 'wiki' });
    const child = await runtime.lifecycle.create(ORG, { title: 'Child', content: 'c', knowledgeType: 'documentation', category: 'technical', source: 'wiki' });

    await runtime.relationships.addRelated(ORG, root.id, related.id);
    await runtime.relationships.setParent(ORG, child.id, root.id);

    const result = await runtime.queries.findRelatedKnowledge({ organizationId: ORG, knowledgeEntryId: root.id });
    expect(result.entries.map((e) => e.id).sort()).toEqual([child.id, related.id].sort());
  });

  it('findExpiringKnowledge() delegates to the retention engine', async () => {
    const runtime = createInstitutionalMemoryRuntime({ now: () => '2026-01-01T00:00:00.000Z' });
    const soon = await runtime.lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-01-05T00:00:00.000Z',
    });

    const result = await runtime.queries.findExpiringKnowledge({ organizationId: ORG, withinDays: 10 });
    expect(result.entries.map((e) => e.id)).toEqual([soon.id]);
  });

  it('searchKnowledge() delegates to the search engine', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const entry = await runtime.lifecycle.create(ORG, {
      title: 'Refund policy',
      content: 'How to process refunds',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
    });

    const result = await runtime.queries.searchKnowledge({ organizationId: ORG, keyword: 'refund' });
    expect(result.matches.map((m) => m.entry.id)).toEqual([entry.id]);
    expect(result.total).toBe(1);
  });

  it('findKnowledge() paginates with offset and limit', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    await runtime.lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await runtime.lifecycle.create(ORG, { title: 'B', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });
    await runtime.lifecycle.create(ORG, { title: 'C', content: 'c', knowledgeType: 'faq', category: 'general', source: 'support' });

    const page = await runtime.queries.findKnowledge({ organizationId: ORG, offset: 1, limit: 1 });
    expect(page.entries).toHaveLength(1);
    expect(page.total).toBe(3);
  });

  it('findRelatedKnowledge() returns an empty result for an unknown entry', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const result = await runtime.queries.findRelatedKnowledge({ organizationId: ORG, knowledgeEntryId: 'missing' });
    expect(result.entries).toEqual([]);
  });

  it('does not expose repositories on the runtime surface', () => {
    const runtime = createInstitutionalMemoryRuntime();
    expect((runtime as Record<string, unknown>).knowledgeEntryRepository).toBeUndefined();
    expect(Object.keys(runtime).sort()).toEqual(
      ['events', 'lifecycle', 'queries', 'relationships', 'retention', 'search', 'validation'].sort(),
    );
  });
});
