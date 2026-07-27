import { describe, expect, it } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createRelationshipRepository } from '../src/store/relationship-repository.impl.js';
import { createGraphRepository } from '../src/store/graph-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createGraphSearchEngine } from '../src/search/engine.impl.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

function setup() {
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();
  const registry = createEntityRegistry(entityRepository);
  const graphRepository = createGraphRepository(entityRepository, relationshipRepository);
  const search = createGraphSearchEngine(graphRepository);
  return { registry, search };
}

describe('createGraphSearchEngine', () => {
  it('ranks an exact name match above a substring match', async () => {
    const { registry, search } = setup();
    const exact = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1', label: 'Acme' });
    const partial = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-2', label: 'Acme Corp' });

    const results = await search.search(ORG, GRAPH, { name: 'Acme' });
    expect(results.map((r) => r.entity.nodeId)).toEqual([exact.nodeId, partial.nodeId]);
  });

  it('matches names case-insensitively', async () => {
    const { registry, search } = setup();
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1', label: 'ACME' });
    const results = await search.search(ORG, GRAPH, { name: 'acme' });
    expect(results.map((r) => r.entity.nodeId)).toEqual([entity.nodeId]);
  });

  it('filters by nodeType', async () => {
    const { registry, search } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1' });
    await registry.register(ORG, GRAPH, { nodeType: 'lead', entityId: 'l-1' });
    const results = await search.search(ORG, GRAPH, { nodeType: 'lead' });
    expect(results).toHaveLength(1);
  });

  it('filters by status', async () => {
    const { registry, search } = setup();
    const active = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1' });
    const archived = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-2' });
    await registry.archive(ORG, GRAPH, archived.nodeId);

    const results = await search.search(ORG, GRAPH, { status: 'active' });
    expect(results.map((r) => r.entity.nodeId)).toEqual([active.nodeId]);
  });

  it('matches tags stored in properties', async () => {
    const { registry, search } = setup();
    const tagged = await registry.register(ORG, GRAPH, {
      nodeType: 'campaign',
      entityId: 'camp-1',
      properties: { tags: ['q1', 'digital'] },
    });
    await registry.register(ORG, GRAPH, { nodeType: 'campaign', entityId: 'camp-2', properties: { tags: ['q2'] } });

    const results = await search.search(ORG, GRAPH, { tags: ['digital'] });
    expect(results.map((r) => r.entity.nodeId)).toEqual([tagged.nodeId]);
  });

  it('excludes entities with zero matching tags', async () => {
    const { registry, search } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'campaign', entityId: 'camp-1', properties: { tags: ['q1'] } });
    expect(await search.search(ORG, GRAPH, { tags: ['unrelated'] })).toEqual([]);
  });

  it('matches metadata key/value pairs', async () => {
    const { registry, search } = setup();
    const match = await registry.register(ORG, GRAPH, { nodeType: 'market', entityId: 'm-1', properties: { region: 'GCC' } });
    await registry.register(ORG, GRAPH, { nodeType: 'market', entityId: 'm-2', properties: { region: 'EU' } });

    const results = await search.search(ORG, GRAPH, { metadata: { region: 'GCC' } });
    expect(results.map((r) => r.entity.nodeId)).toEqual([match.nodeId]);
  });

  it('returns all matching entities with score 1 when no scored criteria are given', async () => {
    const { registry, search } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1' });
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-2' });
    const results = await search.search(ORG, GRAPH, {});
    expect(results.every((r) => r.score === 1)).toBe(true);
    expect(results).toHaveLength(2);
  });

  it('respects the limit parameter', async () => {
    const { registry, search } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1' });
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-2' });
    expect(await search.search(ORG, GRAPH, { limit: 1 })).toHaveLength(1);
  });

  it('is scoped per (organizationId, graphId)', async () => {
    const { registry, search } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'c-1', label: 'Acme' });
    expect(await search.search(ORG, 'graph-2', { name: 'Acme' })).toEqual([]);
  });
});
