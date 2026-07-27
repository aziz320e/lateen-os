import { describe, expect, it, vi } from 'vitest';
import { createKnowledgeEntryRepository, createKnowledgeEntryVersionRepository } from '../src/knowledge/repository.impl.js';
import { createKnowledgeLifecycle } from '../src/knowledge/lifecycle.impl.js';
import { createKnowledgeRelationshipService } from '../src/knowledge/relationships.impl.js';
import { createInstitutionalMemoryEventBus } from '../src/events/institutional-memory-event-bus.js';
import { CircularRelationshipError, KnowledgeEntryNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createKnowledgeEntryRepository();
  const versionRepository = createKnowledgeEntryVersionRepository();
  const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
  const relationships = createKnowledgeRelationshipService(repository);
  return { repository, lifecycle, relationships };
}

function entryInput(title: string) {
  return { title, content: title, knowledgeType: 'documentation' as const, category: 'technical' as const, source: 'wiki' };
}

describe('createKnowledgeRelationshipService', () => {
  it('addRelated() links both entries symmetrically', async () => {
    const { lifecycle, relationships, repository } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));

    await relationships.addRelated(ORG, a.id, b.id);

    const reloadedA = await repository.findById(ORG, a.id);
    const reloadedB = await repository.findById(ORG, b.id);
    expect(reloadedA?.relatedKnowledgeEntryIds).toEqual([b.id]);
    expect(reloadedB?.relatedKnowledgeEntryIds).toEqual([a.id]);
  });

  it('addRelated() rejects self-relation', async () => {
    const { lifecycle, relationships } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    await expect(relationships.addRelated(ORG, a.id, a.id)).rejects.toBeInstanceOf(CircularRelationshipError);
  });

  it('setParent() sets the parent and getChildren() finds it back', async () => {
    const { lifecycle, relationships } = setup();
    const parent = await lifecycle.create(ORG, entryInput('Parent'));
    const child = await lifecycle.create(ORG, entryInput('Child'));

    const updated = await relationships.setParent(ORG, child.id, parent.id);
    expect(updated.parentKnowledgeEntryId).toBe(parent.id);

    const children = await relationships.getChildren(ORG, parent.id);
    expect(children.map((c) => c.id)).toEqual([child.id]);
  });

  it('setParent() rejects a cycle', async () => {
    const { lifecycle, relationships } = setup();
    const grandparent = await lifecycle.create(ORG, entryInput('Grandparent'));
    const parent = await lifecycle.create(ORG, entryInput('Parent'));
    const child = await lifecycle.create(ORG, entryInput('Child'));

    await relationships.setParent(ORG, parent.id, grandparent.id);
    await relationships.setParent(ORG, child.id, parent.id);

    await expect(relationships.setParent(ORG, grandparent.id, child.id)).rejects.toBeInstanceOf(CircularRelationshipError);
  });

  it('getAncestry() walks up the parent chain to the root', async () => {
    const { lifecycle, relationships } = setup();
    const grandparent = await lifecycle.create(ORG, entryInput('Grandparent'));
    const parent = await lifecycle.create(ORG, entryInput('Parent'));
    const child = await lifecycle.create(ORG, entryInput('Child'));
    await relationships.setParent(ORG, parent.id, grandparent.id);
    await relationships.setParent(ORG, child.id, parent.id);

    const ancestry = await relationships.getAncestry(ORG, child.id);
    expect(ancestry.map((e) => e.id)).toEqual([parent.id, grandparent.id]);
  });

  it('addReference() adds a directed edge and rejects a cycle', async () => {
    const { lifecycle, relationships } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));
    const c = await lifecycle.create(ORG, entryInput('C'));

    await relationships.addReference(ORG, a.id, b.id);
    await relationships.addReference(ORG, b.id, c.id);

    await expect(relationships.addReference(ORG, c.id, a.id)).rejects.toBeInstanceOf(CircularRelationshipError);
  });

  it('addReference() rejects self-reference', async () => {
    const { lifecycle, relationships } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    await expect(relationships.addReference(ORG, a.id, a.id)).rejects.toBeInstanceOf(CircularRelationshipError);
  });

  it('getDependencyGraph() returns every entry as a node and every reference as an edge', async () => {
    const { lifecycle, relationships } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));
    await relationships.addReference(ORG, a.id, b.id);

    const graph = await relationships.getDependencyGraph(ORG);
    expect(graph.nodes).toEqual(expect.arrayContaining([a.id, b.id]));
    expect(graph.edges).toEqual([{ fromKnowledgeEntryId: a.id, toKnowledgeEntryId: b.id, relationshipType: 'reference' }]);
  });

  it('throws KnowledgeEntryNotFoundError when relating to an unknown entry', async () => {
    const { lifecycle, relationships } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    await expect(relationships.addRelated(ORG, a.id, 'missing')).rejects.toBeInstanceOf(KnowledgeEntryNotFoundError);
  });

  it('addRelated() is idempotent — calling it twice does not duplicate the link', async () => {
    const { lifecycle, relationships, repository } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));

    await relationships.addRelated(ORG, a.id, b.id);
    await relationships.addRelated(ORG, a.id, b.id);

    const reloaded = await repository.findById(ORG, a.id);
    expect(reloaded?.relatedKnowledgeEntryIds).toEqual([b.id]);
  });

  it('getAncestry() returns an empty array for an entry with no parent', async () => {
    const { lifecycle, relationships } = setup();
    const root = await lifecycle.create(ORG, entryInput('Root'));
    expect(await relationships.getAncestry(ORG, root.id)).toEqual([]);
  });

  it('addReference() is idempotent — calling it twice does not duplicate the edge', async () => {
    const { lifecycle, relationships, repository } = setup();
    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));

    await relationships.addReference(ORG, a.id, b.id);
    await relationships.addReference(ORG, a.id, b.id);

    const reloaded = await repository.findById(ORG, a.id);
    expect(reloaded?.referenceIds).toEqual([b.id]);
  });

  it('publishes knowledge.relationship.created for related/parent_child/reference', async () => {
    const eventBus = createInstitutionalMemoryEventBus();
    const handler = vi.fn();
    eventBus.subscribe('knowledge.relationship.created', handler);

    const repository = createKnowledgeEntryRepository();
    const versionRepository = createKnowledgeEntryVersionRepository();
    const lifecycle = createKnowledgeLifecycle(repository, versionRepository);
    const relationships = createKnowledgeRelationshipService(repository, eventBus);

    const a = await lifecycle.create(ORG, entryInput('A'));
    const b = await lifecycle.create(ORG, entryInput('B'));
    const c = await lifecycle.create(ORG, entryInput('C'));

    await relationships.addRelated(ORG, a.id, b.id);
    await relationships.setParent(ORG, b.id, a.id);
    await relationships.addReference(ORG, a.id, c.id);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ relationshipType: 'related' }),
      expect.any(Object),
    );
    expect(handler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ relationshipType: 'parent_child' }),
      expect.any(Object),
    );
    expect(handler).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ relationshipType: 'reference' }),
      expect.any(Object),
    );
  });
});
