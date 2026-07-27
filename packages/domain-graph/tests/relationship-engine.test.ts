import { describe, expect, it, vi } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createRelationshipRepository } from '../src/store/relationship-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createRelationshipEngine } from '../src/relationship-engine/engine.impl.js';
import { createDomainGraphEventBus } from '../src/events/domain-graph-event-bus.js';
import { DanglingRelationshipError, GraphRelationshipNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

function setup(eventBus = createDomainGraphEventBus()) {
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();
  const registry = createEntityRegistry(entityRepository, eventBus);
  const engine = createRelationshipEngine(entityRepository, relationshipRepository, eventBus);
  return { entityRepository, relationshipRepository, registry, engine, eventBus };
}

describe('createRelationshipEngine', () => {
  it('create() creates a relationship between two registered entities', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    const relationship = await engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    expect(relationship.relationshipType).toBe('belongs_to');
    expect(relationship.sourceNodeId).toBe(a.nodeId);
    expect(relationship.targetNodeId).toBe(b.nodeId);
  });

  it('create() rejects a dangling source node', async () => {
    const { registry, engine } = setup();
    const b = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await expect(
      engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: 'missing', targetNodeId: b.nodeId }),
    ).rejects.toBeInstanceOf(DanglingRelationshipError);
  });

  it('create() rejects a dangling target node', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await expect(
      engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: a.nodeId, targetNodeId: 'missing' }),
    ).rejects.toBeInstanceOf(DanglingRelationshipError);
  });

  it('supports every relationship type added by this commit', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-2' });
    for (const relationshipType of [
      'owns',
      'belongs_to',
      'manages',
      'depends_on',
      'references',
      'related_to',
      'competitor_of',
      'customer_of',
      'supplier_of',
      'member_of',
      'executes',
      'created_by',
      'assigned_to',
      'blocked_by',
    ] as const) {
      const relationship = await engine.create(ORG, GRAPH, { relationshipType, sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
      expect(relationship.relationshipType).toBe(relationshipType);
    }
  });

  it('update() merges label/properties', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const relationship = await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    const updated = await engine.update(ORG, GRAPH, relationship.relationshipId, { label: 'Primary membership' });
    expect(updated.label).toBe('Primary membership');
  });

  it('update() throws GraphRelationshipNotFoundError for an unknown relationship', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, GRAPH, 'missing', { label: 'x' })).rejects.toBeInstanceOf(GraphRelationshipNotFoundError);
  });

  it('delete() removes the relationship (hard delete, not archive)', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const relationship = await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.delete(ORG, GRAPH, relationship.relationshipId);
    expect(await engine.get(ORG, GRAPH, relationship.relationshipId)).toBeNull();
  });

  it('delete() throws GraphRelationshipNotFoundError for an unknown relationship', async () => {
    const { engine } = setup();
    await expect(engine.delete(ORG, GRAPH, 'missing')).rejects.toBeInstanceOf(GraphRelationshipNotFoundError);
  });

  it('publishes relationship.created, relationship.updated, relationship.deleted', async () => {
    const eventBus = createDomainGraphEventBus();
    const created = vi.fn();
    const updated = vi.fn();
    const deleted = vi.fn();
    eventBus.subscribe('relationship.created', created);
    eventBus.subscribe('relationship.updated', updated);
    eventBus.subscribe('relationship.deleted', deleted);

    const { registry, engine } = setup(eventBus);
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const relationship = await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.update(ORG, GRAPH, relationship.relationshipId, { label: 'x' });
    await engine.delete(ORG, GRAPH, relationship.relationshipId);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(updated).toHaveBeenCalledTimes(1);
    expect(deleted).toHaveBeenCalledTimes(1);
  });

  it('list() is scoped per (organizationId, graphId)', async () => {
    const { registry, engine } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    expect(await engine.list(ORG, 'graph-2')).toHaveLength(0);
    expect(await engine.list(ORG, GRAPH)).toHaveLength(1);
  });
});
