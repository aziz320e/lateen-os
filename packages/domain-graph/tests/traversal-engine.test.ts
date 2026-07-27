import { describe, expect, it } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createRelationshipRepository } from '../src/store/relationship-repository.impl.js';
import { createGraphRepository } from '../src/store/graph-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createRelationshipEngine } from '../src/relationship-engine/engine.impl.js';
import { createTraversalEngine } from '../src/traversal/engine.impl.js';
import { CyclicDependencyError } from '../src/shared/errors.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

function setup() {
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();
  const registry = createEntityRegistry(entityRepository);
  const engine = createRelationshipEngine(entityRepository, relationshipRepository);
  const graphRepository = createGraphRepository(entityRepository, relationshipRepository);
  const traversal = createTraversalEngine(graphRepository);
  return { registry, engine, traversal };
}

describe('createTraversalEngine', () => {
  it('bfs() returns real entities in breadth-first order', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const order = await traversal.bfs(ORG, GRAPH, a.nodeId);
    expect(order.map((entity) => entity.nodeId)).toEqual([a.nodeId, b.nodeId]);
  });

  it('dfs() returns real entities in depth-first order', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const order = await traversal.dfs(ORG, GRAPH, a.nodeId);
    expect(order.map((entity) => entity.nodeId)).toEqual([a.nodeId, b.nodeId]);
  });

  it('shortestPath() delegates to the Graph Repository', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const result = await traversal.shortestPath(ORG, GRAPH, a.nodeId, b.nodeId);
    expect(result?.length).toBe(1);
  });

  it('detectCycles() finds a real dependency cycle', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    const cycles = await traversal.detectCycles(ORG, GRAPH);
    expect(cycles).toHaveLength(1);
  });

  it('dependencyOrder() returns real entities in topological order', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const order = await traversal.dependencyOrder(ORG, GRAPH);
    expect(order.map((entity) => entity.nodeId)).toEqual([a.nodeId, b.nodeId]);
  });

  it('dependencyOrder() throws CyclicDependencyError for a cyclic graph', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    await expect(traversal.dependencyOrder(ORG, GRAPH)).rejects.toBeInstanceOf(CyclicDependencyError);
  });

  it('bfs()/dfs() respect maxDepth', async () => {
    const { registry, engine, traversal } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    const c = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-3' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: c.nodeId });

    const bounded = await traversal.bfs(ORG, GRAPH, a.nodeId, { maxDepth: 1 });
    expect(bounded.map((e) => e.nodeId)).toEqual([a.nodeId, b.nodeId]);
  });
});
