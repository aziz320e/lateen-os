import { describe, expect, it } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';

const ORG = 'org-1';

function setup() {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
  return { repository, versionRepository, lifecycle };
}

describe('createKnowledgeEntryRepository', () => {
  it('findByType() filters by knowledgeType', async () => {
    const { repository, lifecycle } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'policy', category: 'compliance', source: 'legal' });
    await lifecycle.create(ORG, { title: 'B', content: 'b', knowledgeType: 'faq', category: 'general', source: 'support' });
    expect(await repository.findByType(ORG, 'policy')).toHaveLength(1);
    expect(await repository.findByType(ORG, 'faq')).toHaveLength(1);
  });

  it('findByStatus() filters by status', async () => {
    const { repository, lifecycle } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'template', category: 'general', source: 'ops' });
    await lifecycle.transition(ORG, entry.id, 'published');
    expect(await repository.findByStatus(ORG, 'published')).toHaveLength(1);
    expect(await repository.findByStatus(ORG, 'draft')).toHaveLength(0);
  });

  it('findByTags() matches any of the given tags', async () => {
    const { repository, lifecycle } = setup();
    await lifecycle.create(ORG, {
      title: 'A',
      content: 'a',
      knowledgeType: 'playbook',
      category: 'operational',
      source: 'ops',
      tags: ['onboarding'],
    });
    await lifecycle.create(ORG, {
      title: 'B',
      content: 'b',
      knowledgeType: 'playbook',
      category: 'operational',
      source: 'ops',
      tags: ['offboarding'],
    });
    expect(await repository.findByTags(ORG, ['onboarding'])).toHaveLength(1);
    expect(await repository.findByTags(ORG, ['onboarding', 'offboarding'])).toHaveLength(2);
    expect(await repository.findByTags(ORG, ['unrelated'])).toHaveLength(0);
  });

  it('findBySource() filters by provenance label', async () => {
    const { repository, lifecycle } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'sop', category: 'process', source: 'ops-handbook' });
    await lifecycle.create(ORG, { title: 'B', content: 'b', knowledgeType: 'sop', category: 'process', source: 'finance-handbook' });
    expect(await repository.findBySource(ORG, 'ops-handbook')).toHaveLength(1);
  });

  it('findByOrganization() is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    await lifecycle.create(ORG, { title: 'A', content: 'a', knowledgeType: 'documentation', category: 'technical', source: 'wiki' });
    await lifecycle.create('org-2', { title: 'B', content: 'b', knowledgeType: 'documentation', category: 'technical', source: 'wiki' });
    expect(await repository.findByOrganization(ORG)).toHaveLength(1);
  });
});

describe('createKnowledgeEntryVersionRepository', () => {
  it('findByKnowledgeEntry() returns versions ordered by revisionNumber, organization-scoped', async () => {
    const { versionRepository, lifecycle } = setup();
    const entry = await lifecycle.create(ORG, { title: 'A', content: 'v1', knowledgeType: 'best_practice', category: 'general', source: 'ops' });
    await lifecycle.update(ORG, entry.id, { content: 'v2' });
    await lifecycle.update(ORG, entry.id, { content: 'v3' });

    const versions = await versionRepository.findByKnowledgeEntry(ORG, entry.id);
    expect(versions.map((v) => v.revisionNumber)).toEqual([1, 2, 3]);
    expect(await versionRepository.findByKnowledgeEntry('org-2', entry.id)).toHaveLength(0);
  });
});
