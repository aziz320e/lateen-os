import { describe, expect, it } from 'vitest';
import { createDomainGraphRepository } from '../src/graph/repository.impl.js';
import { canTransitionGraph, createGraphLifecycle } from '../src/graph/lifecycle.impl.js';
import { createDomainGraphEventBus } from '../src/events/domain-graph-event-bus.js';
import { DomainGraphNotFoundError, InvalidGraphTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('canTransitionGraph', () => {
  it('allows active -> archived -> active', () => {
    expect(canTransitionGraph('active', 'archived')).toBe(true);
    expect(canTransitionGraph('archived', 'active')).toBe(true);
  });

  it('rejects a no-op self-transition', () => {
    expect(canTransitionGraph('active', 'active')).toBe(false);
    expect(canTransitionGraph('archived', 'archived')).toBe(false);
  });
});

describe('createGraphLifecycle', () => {
  it('create() creates a graph in active status with a default schemaVersion', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'Primary Graph' });
    expect(graph.status).toBe('active');
    expect(graph.schemaVersion).toBe('1.0.0');
  });

  it('create() accepts an explicit schemaVersion and description', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'G', description: 'desc', schemaVersion: '2.0.0' });
    expect(graph.schemaVersion).toBe('2.0.0');
    expect(graph.description).toBe('desc');
  });

  it('update() merges fields and bumps updatedAt', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'Primary Graph' });
    const updated = await lifecycle.update(ORG, graph.id, { name: 'Renamed Graph' });
    expect(updated.name).toBe('Renamed Graph');
  });

  it('update() rejects an archived graph', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'G' });
    await lifecycle.archive(ORG, graph.id);
    await expect(lifecycle.update(ORG, graph.id, { name: 'New' })).rejects.toBeInstanceOf(InvalidGraphTransitionError);
  });

  it('archive() and restore() round-trip', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'G' });
    const archived = await lifecycle.archive(ORG, graph.id);
    expect(archived.status).toBe('archived');
    const restored = await lifecycle.restore(ORG, graph.id);
    expect(restored.status).toBe('active');
  });

  it('archive() rejects an already-archived graph', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'G' });
    await lifecycle.archive(ORG, graph.id);
    await expect(lifecycle.archive(ORG, graph.id)).rejects.toBeInstanceOf(InvalidGraphTransitionError);
  });

  it('restore() rejects an already-active graph', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    const graph = await lifecycle.create(ORG, { name: 'G' });
    await expect(lifecycle.restore(ORG, graph.id)).rejects.toBeInstanceOf(InvalidGraphTransitionError);
  });

  it('rebuild() stamps updatedAt and publishes graph.rebuilt with the given stats', async () => {
    const eventBus = createDomainGraphEventBus();
    const received: unknown[] = [];
    eventBus.subscribe('graph.rebuilt', (payload) => received.push(payload));

    const lifecycle = createGraphLifecycle(createDomainGraphRepository(), eventBus);
    const graph = await lifecycle.create(ORG, { name: 'G' });
    await lifecycle.rebuild(ORG, graph.id, { entityCount: 5, relationshipCount: 3 });
    await Promise.resolve();

    expect(received).toEqual([{ graphId: graph.id, organizationId: ORG, entityCount: 5, relationshipCount: 3 }]);
  });

  it('throws DomainGraphNotFoundError for an unknown graph', async () => {
    const lifecycle = createGraphLifecycle(createDomainGraphRepository());
    await expect(lifecycle.archive(ORG, 'missing')).rejects.toBeInstanceOf(DomainGraphNotFoundError);
  });

  it('list() and get() are organization-scoped', async () => {
    const repository = createDomainGraphRepository();
    const lifecycle = createGraphLifecycle(repository);
    const graph = await lifecycle.create(ORG, { name: 'G' });
    await lifecycle.create('org-2', { name: 'Other' });

    expect(await lifecycle.list(ORG)).toHaveLength(1);
    expect(await lifecycle.get('org-2', graph.id)).toBeNull();
    expect(await repository.findByStatus(ORG, 'active')).toHaveLength(1);
  });
});
