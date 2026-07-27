import { describe, expect, it } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createRelationshipRepository } from '../src/store/relationship-repository.impl.js';
import { createGraphRepository } from '../src/store/graph-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createRelationshipEngine } from '../src/relationship-engine/engine.impl.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

function setup() {
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();
  const registry = createEntityRegistry(entityRepository);
  const engine = createRelationshipEngine(entityRepository, relationshipRepository);
  const repository = createGraphRepository(entityRepository, relationshipRepository);
  return { registry, engine, repository };
}

describe('createGraphRepository', () => {
  it('findEntity() and findEntities() with filters', async () => {
    const { registry, repository } = setup();
    const org = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    const dept = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await registry.archive(ORG, GRAPH, dept.nodeId);

    expect((await repository.findEntity(ORG, GRAPH, org.nodeId))?.nodeId).toBe(org.nodeId);
    expect(await repository.findEntities(ORG, GRAPH, { nodeType: 'organization' })).toHaveLength(1);
    expect(await repository.findEntities(ORG, GRAPH, { status: 'archived' })).toHaveLength(1);
    expect(await repository.findEntities(ORG, GRAPH)).toHaveLength(2);
  });

  it('findRelationships() with filters', async () => {
    const { registry, engine, repository } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const rel = await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    expect(await repository.findRelationships(ORG, GRAPH, { relationshipType: 'member_of' })).toHaveLength(1);
    expect(await repository.findRelationships(ORG, GRAPH, { sourceNodeId: a.nodeId })).toEqual([rel]);
    expect(await repository.findRelationships(ORG, GRAPH, { targetNodeId: b.nodeId })).toEqual([rel]);
  });

  it('findNeighbors() supports in/out/both directions', async () => {
    const { registry, engine, repository } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    expect((await repository.findNeighbors(ORG, GRAPH, a.nodeId, 'out')).map((n) => n.nodeId)).toEqual([b.nodeId]);
    expect((await repository.findNeighbors(ORG, GRAPH, b.nodeId, 'in')).map((n) => n.nodeId)).toEqual([a.nodeId]);
    expect((await repository.findNeighbors(ORG, GRAPH, a.nodeId, 'both')).map((n) => n.nodeId)).toEqual([b.nodeId]);
    expect(await repository.findNeighbors(ORG, GRAPH, a.nodeId, 'in')).toEqual([]);
  });

  it('findParents() returns the targets of outgoing edges', async () => {
    const { registry, engine, repository } = setup();
    const child = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const parent = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: child.nodeId, targetNodeId: parent.nodeId });

    expect((await repository.findParents(ORG, GRAPH, child.nodeId)).map((n) => n.nodeId)).toEqual([parent.nodeId]);
  });

  it('findChildren() returns the sources of incoming edges', async () => {
    const { registry, engine, repository } = setup();
    const child = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const parent = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: child.nodeId, targetNodeId: parent.nodeId });

    expect((await repository.findChildren(ORG, GRAPH, parent.nodeId)).map((n) => n.nodeId)).toEqual([child.nodeId]);
  });

  it('shortestPath() finds a path across entities', async () => {
    const { registry, engine, repository } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const c = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'belongs_to', sourceNodeId: b.nodeId, targetNodeId: c.nodeId });

    const result = await repository.shortestPath(ORG, GRAPH, a.nodeId, c.nodeId);
    expect(result?.length).toBe(2);
    expect(result?.nodes.map((n) => n.nodeId)).toEqual([a.nodeId, b.nodeId, c.nodeId]);
  });

  it('shortestPath() returns null when unreachable', async () => {
    const { registry, repository } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    expect(await repository.shortestPath(ORG, GRAPH, a.nodeId, b.nodeId)).toBeNull();
  });

  it('connectedComponents() groups connected entities', async () => {
    const { registry, engine, repository } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const c = await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const components = await repository.connectedComponents(ORG, GRAPH);
    expect(components).toHaveLength(2);
    expect(components.map((component) => component.length).sort()).toEqual([1, 2]);
    expect(components.some((component) => component.some((n) => n.nodeId === c.nodeId))).toBe(true);
  });

  it('is scoped per (organizationId, graphId)', async () => {
    const { registry, repository } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'organization', entityId: 'o-1' });
    await registry.register(ORG, 'graph-2', { nodeType: 'organization', entityId: 'o-2' });
    expect(await repository.findEntities(ORG, GRAPH)).toHaveLength(1);
    expect(await repository.findEntities(ORG, 'graph-2')).toHaveLength(1);
  });
});
