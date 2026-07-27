import { describe, expect, it } from 'vitest';
import { createDomainGraphRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createDomainGraphQueries (via createDomainGraphRuntime)', () => {
  it('findEntity() returns an entity or null', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const entity = await runtime.entities.register(ORG, graph.id, { nodeType: 'organization', entityId: 'o-1' });

    const found = await runtime.queries.findEntity({ organizationId: ORG, graphId: graph.id, nodeId: entity.nodeId });
    expect(found.entity?.nodeId).toBe(entity.nodeId);

    const missing = await runtime.queries.findEntity({ organizationId: ORG, graphId: graph.id, nodeId: 'missing' });
    expect(missing.entity).toBeNull();
  });

  it('searchEntities() returns ranked matches', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const entity = await runtime.entities.register(ORG, graph.id, { nodeType: 'customer', entityId: 'c-1', label: 'Acme' });

    const result = await runtime.queries.searchEntities({ organizationId: ORG, graphId: graph.id, name: 'Acme' });
    expect(result.matches.map((m) => m.entity.nodeId)).toEqual([entity.nodeId]);
    expect(result.total).toBe(1);
  });

  it('findRelationships() filters by type/source/target', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'employee', entityId: 'e-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'department', entityId: 'd-1' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const result = await runtime.queries.findRelationships({ organizationId: ORG, graphId: graph.id, relationshipType: 'member_of' });
    expect(result.total).toBe(1);
  });

  it('findNeighbors() returns adjacent entities', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'employee', entityId: 'e-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'department', entityId: 'd-1' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const result = await runtime.queries.findNeighbors({ organizationId: ORG, graphId: graph.id, nodeId: a.nodeId });
    expect(result.neighbors.map((n) => n.nodeId)).toEqual([b.nodeId]);
  });

  it('shortestPath() finds the path between two entities', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'employee', entityId: 'e-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'department', entityId: 'd-1' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const result = await runtime.queries.shortestPath({ organizationId: ORG, graphId: graph.id, sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    expect(result.path?.length).toBe(1);
  });

  it('dependencyOrder() returns a topological order', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-2' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const result = await runtime.queries.dependencyOrder({ organizationId: ORG, graphId: graph.id });
    expect(result.order.map((e) => e.nodeId)).toEqual([a.nodeId, b.nodeId]);
  });

  it('detectCycles() finds cycles', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-2' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    const result = await runtime.queries.detectCycles({ organizationId: ORG, graphId: graph.id });
    expect(result.cycles).toHaveLength(1);
  });

  it('graphStatistics() summarizes counts by type and connected components', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'employee', entityId: 'e-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'department', entityId: 'd-1' });
    await runtime.entities.register(ORG, graph.id, { nodeType: 'lead', entityId: 'l-1' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const stats = await runtime.queries.graphStatistics({ organizationId: ORG, graphId: graph.id });
    expect(stats.entityCount).toBe(3);
    expect(stats.relationshipCount).toBe(1);
    expect(stats.entityCountsByType).toEqual({ employee: 1, department: 1, lead: 1 });
    expect(stats.relationshipCountsByType).toEqual({ member_of: 1 });
    expect(stats.componentCount).toBe(2);
  });

  it('does not expose repositories on the runtime surface', () => {
    const runtime = createDomainGraphRuntime();
    expect((runtime as Record<string, unknown>).entityRepository).toBeUndefined();
    expect((runtime as Record<string, unknown>).graphRepository).toBeUndefined();
    expect(Object.keys(runtime).sort()).toEqual(
      ['entities', 'events', 'graphs', 'queries', 'relationships', 'search', 'traversal', 'validation'].sort(),
    );
  });
});
