import { describe, expect, it, vi } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createDomainGraphEventBus } from '../src/events/domain-graph-event-bus.js';
import { GraphEntityNotFoundError, InvalidGraphTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

describe('createEntityRegistry', () => {
  it('register() creates an active entity', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'entity-1', label: 'Acme' });
    expect(entity.status).toBe('active');
    expect(entity.graphId).toBe(GRAPH);
    expect(entity.label).toBe('Acme');
  });

  it('register() allows duplicate (nodeType, entityId) pairs — permissive by design', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    const first = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    const second = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    expect(first.nodeId).not.toBe(second.nodeId);
  });

  it('update() merges label/properties', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'lead', entityId: 'lead-1', label: 'Lead A' });
    const updated = await registry.update(ORG, GRAPH, entity.nodeId, { properties: { score: 90 } });
    expect(updated.label).toBe('Lead A');
    expect(updated.properties).toEqual({ score: 90 });
  });

  it('update() rejects an archived entity', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'contact', entityId: 'c-1' });
    await registry.archive(ORG, GRAPH, entity.nodeId);
    await expect(registry.update(ORG, GRAPH, entity.nodeId, { label: 'New' })).rejects.toBeInstanceOf(InvalidGraphTransitionError);
  });

  it('archive() sets status to archived', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'campaign', entityId: 'camp-1' });
    const archived = await registry.archive(ORG, GRAPH, entity.nodeId);
    expect(archived.status).toBe('archived');
  });

  it('throws GraphEntityNotFoundError for an unknown entity', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    await expect(registry.archive(ORG, GRAPH, 'missing')).rejects.toBeInstanceOf(GraphEntityNotFoundError);
  });

  it('registers every new entity type added by this commit', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    for (const nodeType of ['lead', 'contact', 'competitor', 'market', 'mission', 'knowledge', 'document', 'campaign'] as const) {
      const entity = await registry.register(ORG, GRAPH, { nodeType, entityId: `${nodeType}-1` });
      expect(entity.nodeType).toBe(nodeType);
    }
  });

  it('publishes entity.created, entity.updated, entity.archived', async () => {
    const eventBus = createDomainGraphEventBus();
    const created = vi.fn();
    const updated = vi.fn();
    const archived = vi.fn();
    eventBus.subscribe('entity.created', created);
    eventBus.subscribe('entity.updated', updated);
    eventBus.subscribe('entity.archived', archived);

    const registry = createEntityRegistry(createEntityRepository(), eventBus);
    const entity = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'e-1' });
    await registry.update(ORG, GRAPH, entity.nodeId, { label: 'Renamed' });
    await registry.archive(ORG, GRAPH, entity.nodeId);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
    expect(archived).toHaveBeenCalledTimes(1);
  });

  it('list() is scoped per (organizationId, graphId)', async () => {
    const registry = createEntityRegistry(createEntityRepository());
    await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'e-1' });
    await registry.register(ORG, 'graph-2', { nodeType: 'organization', entityId: 'e-2' });
    await registry.register('org-2', GRAPH, { nodeType: 'organization', entityId: 'e-3' });

    expect(await registry.list(ORG, GRAPH)).toHaveLength(1);
    expect(await registry.list(ORG, 'graph-2')).toHaveLength(1);
    expect(await registry.list('org-2', GRAPH)).toHaveLength(1);
  });
});
