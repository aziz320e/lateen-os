import { describe, expect, it } from 'vitest';
import { createInstitutionalMemoryRuntime } from '../src/runtime.js';
import { KnowledgeEntryNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createInstitutionalMemoryRuntime — composition root', () => {
  it('exposes exactly lifecycle, search, relationships, validation, retention, queries, and events', () => {
    const runtime = createInstitutionalMemoryRuntime();
    expect(runtime.lifecycle).toBeDefined();
    expect(runtime.search).toBeDefined();
    expect(runtime.relationships).toBeDefined();
    expect(runtime.validation).toBeDefined();
    expect(runtime.retention).toBeDefined();
    expect(runtime.queries).toBeDefined();
    expect(runtime.events).toBeDefined();
  });

  it('accepts an injected event bus and now() for determinism', async () => {
    const eventBus = createInstitutionalMemoryRuntime().events;
    const fixedNow = () => '2024-01-01T00:00:00.000Z';
    const runtime = createInstitutionalMemoryRuntime({ eventBus, now: fixedNow });
    const entry = await runtime.lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'faq',
      category: 'general',
      source: 'support',
    });
    expect(entry.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('two independently created runtimes never share state', async () => {
    const runtimeA = createInstitutionalMemoryRuntime();
    const runtimeB = createInstitutionalMemoryRuntime();
    const entry = await runtimeA.lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'faq',
      category: 'general',
      source: 'support',
    });
    await expect(runtimeB.lifecycle.archive(ORG, entry.id)).rejects.toBeInstanceOf(KnowledgeEntryNotFoundError);
  });
});

describe('Institutional Memory Runtime — end-to-end integration', () => {
  it('create -> update -> relate -> validate -> retire flows through every real engine', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const events: string[] = [];
    runtime.events.subscribeAll((name) => {
      events.push(name);
    });

    const policy = await runtime.lifecycle.create(ORG, {
      title: 'Refund Policy',
      content: 'Refunds are issued within 48 hours.',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      tags: ['refunds'],
    });
    const sop = await runtime.lifecycle.create(ORG, {
      title: 'Refund SOP',
      content: 'Steps to process a refund.',
      knowledgeType: 'sop',
      category: 'process',
      source: 'ops',
    });

    await runtime.relationships.addRelated(ORG, policy.id, sop.id);
    await runtime.relationships.setParent(ORG, sop.id, policy.id);

    const updated = await runtime.lifecycle.update(ORG, policy.id, {
      content: 'Refunds are issued within 24 hours.',
      authorId: 'employee-1',
      changeSummary: 'Tightened SLA',
    });
    expect(updated.currentVersion).toBe(2);

    const duplicates = await runtime.validation.detectDuplicates(ORG, 'Refund Policy');
    expect(duplicates.map((d) => d.entry.id)).toContain(policy.id);

    const searchResult = await runtime.queries.searchKnowledge({ organizationId: ORG, keyword: 'refund' });
    expect(searchResult.matches.map((m) => m.entry.id)).toEqual(expect.arrayContaining([policy.id, sop.id]));

    const related = await runtime.queries.findRelatedKnowledge({ organizationId: ORG, knowledgeEntryId: policy.id });
    expect(related.entries.map((e) => e.id)).toEqual(expect.arrayContaining([sop.id]));

    await runtime.lifecycle.archive(ORG, sop.id);
    const restored = await runtime.lifecycle.restore(ORG, sop.id);
    expect(restored.status).toBe('draft');

    expect(events).toEqual(
      expect.arrayContaining([
        'knowledge.created',
        'knowledge.version.created',
        'knowledge.relationship.created',
        'knowledge.updated',
        'knowledge.archived',
        'knowledge.restored',
      ]),
    );
  });

  it('retention rules run end-to-end and surface via findExpiringKnowledge()', async () => {
    const now = () => '2026-01-01T00:00:00.000Z';
    const runtime = createInstitutionalMemoryRuntime({ now });
    const expiring = await runtime.lifecycle.create(ORG, {
      title: 'Temporary Policy',
      content: 'Valid for Q1 only.',
      knowledgeType: 'policy',
      category: 'compliance',
      source: 'legal',
      expiresAt: '2026-01-10T00:00:00.000Z',
    });

    const soon = await runtime.queries.findExpiringKnowledge({ organizationId: ORG, withinDays: 30 });
    expect(soon.entries.map((e) => e.id)).toEqual([expiring.id]);

    const result = await runtime.retention.applyRetentionRules(ORG, '2026-02-01T00:00:00.000Z');
    expect(result.expired).toEqual([expiring.id]);

    const reloaded = await runtime.lifecycle.get(ORG, expiring.id);
    expect(reloaded?.status).toBe('archived');
  });

  it('validateOwnership() integrates with the lifecycle to catch missing owners before publishing', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const entry = await runtime.lifecycle.create(ORG, {
      title: 'Confidential Playbook',
      content: 'Sensitive procedure.',
      knowledgeType: 'playbook',
      category: 'operational',
      source: 'ops',
      visibility: 'restricted',
    });

    const result = runtime.validation.validateOwnership(entry);
    expect(result.ok).toBe(false);

    const withOwner = await runtime.lifecycle.update(ORG, entry.id, { ownerId: 'employee-1' });
    expect(runtime.validation.validateOwnership(withOwner).ok).toBe(true);
  });

  it('every module is organization-scoped end to end', async () => {
    const runtime = createInstitutionalMemoryRuntime();
    const entryA = await runtime.lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'faq', category: 'general', source: 'support' });
    await runtime.lifecycle.create('org-2', { title: 'B', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });

    const orgAResults = await runtime.queries.findKnowledge({ organizationId: ORG });
    expect(orgAResults.total).toBe(1);
    expect(orgAResults.entries[0]?.id).toBe(entryA.id);

    const orgBResults = await runtime.queries.findKnowledge({ organizationId: 'org-2' });
    expect(orgBResults.total).toBe(1);
  });
});
