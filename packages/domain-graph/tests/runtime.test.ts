import { describe, expect, it } from 'vitest';
import { createDomainGraphRuntime } from '../src/runtime.js';
import { CyclicDependencyError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createDomainGraphRuntime — composition root', () => {
  it('exposes exactly graphs, entities, relationships, traversal, validation, search, queries, and events', () => {
    const runtime = createDomainGraphRuntime();
    expect(runtime.graphs).toBeDefined();
    expect(runtime.entities).toBeDefined();
    expect(runtime.relationships).toBeDefined();
    expect(runtime.traversal).toBeDefined();
    expect(runtime.validation).toBeDefined();
    expect(runtime.search).toBeDefined();
    expect(runtime.queries).toBeDefined();
    expect(runtime.events).toBeDefined();
  });

  it('accepts an injected event bus and now() for determinism', async () => {
    const eventBus = createDomainGraphRuntime().events;
    const fixedNow = () => '2024-01-01T00:00:00.000Z';
    const runtime = createDomainGraphRuntime({ eventBus, now: fixedNow });
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    expect(graph.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('two independently created runtimes never share state', async () => {
    const runtimeA = createDomainGraphRuntime();
    const runtimeB = createDomainGraphRuntime();
    const graph = await runtimeA.graphs.create(ORG, { name: 'G' });
    expect(await runtimeB.graphs.get(ORG, graph.id)).toBeNull();
  });
});

describe('Domain Graph Runtime — end-to-end integration', () => {
  it('create graph -> register entities -> relate -> validate -> query flows through every real engine', async () => {
    const runtime = createDomainGraphRuntime();
    const events: string[] = [];
    runtime.events.subscribeAll((name) => {
      events.push(name);
    });

    const graph = await runtime.graphs.create(ORG, { name: 'Primary Graph' });

    const org = await runtime.entities.register(ORG, graph.id, { nodeType: 'organization', entityId: 'org-entity-1', label: 'Acme Corp' });
    const dept = await runtime.entities.register(ORG, graph.id, { nodeType: 'department', entityId: 'dept-1', label: 'Sales' });
    const employee = await runtime.entities.register(ORG, graph.id, { nodeType: 'employee', entityId: 'emp-1', label: 'Alex' });
    const competitor = await runtime.entities.register(ORG, graph.id, { nodeType: 'competitor', entityId: 'comp-1', label: 'Rivalco' });

    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'belongs_to', sourceNodeId: dept.nodeId, targetNodeId: org.nodeId });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'member_of', sourceNodeId: employee.nodeId, targetNodeId: dept.nodeId });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'competitor_of', sourceNodeId: competitor.nodeId, targetNodeId: org.nodeId });

    const report = await runtime.validation.validate(ORG, graph.id);
    expect(report.isValid).toBe(true);

    const { path } = await runtime.queries.shortestPath({
      organizationId: ORG,
      graphId: graph.id,
      sourceNodeId: employee.nodeId,
      targetNodeId: org.nodeId,
    });
    expect(path?.length).toBe(2);

    const stats = await runtime.queries.graphStatistics({ organizationId: ORG, graphId: graph.id });
    expect(stats.entityCount).toBe(4);
    expect(stats.relationshipCount).toBe(3);

    await runtime.graphs.rebuild(ORG, graph.id, { entityCount: stats.entityCount, relationshipCount: stats.relationshipCount });

    expect(events).toEqual(
      expect.arrayContaining([
        'entity.created',
        'relationship.created',
        'graph.validated',
        'graph.rebuilt',
      ]),
    );
  });

  it('archiving an entity is reflected in findEntities({status}) and search', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const entity = await runtime.entities.register(ORG, graph.id, { nodeType: 'lead', entityId: 'l-1', label: 'Prospect' });
    await runtime.entities.archive(ORG, graph.id, entity.nodeId);

    const activeSearch = await runtime.queries.searchEntities({ organizationId: ORG, graphId: graph.id, status: 'active' });
    expect(activeSearch.total).toBe(0);
    const archivedSearch = await runtime.queries.searchEntities({ organizationId: ORG, graphId: graph.id, status: 'archived' });
    expect(archivedSearch.total).toBe(1);
  });

  it('a dependency cycle surfaces consistently through validation, traversal, and the query layer', async () => {
    const runtime = createDomainGraphRuntime();
    const graph = await runtime.graphs.create(ORG, { name: 'G' });
    const a = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await runtime.entities.register(ORG, graph.id, { nodeType: 'workflow', entityId: 'w-2' });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await runtime.relationships.create(ORG, graph.id, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    const report = await runtime.validation.validate(ORG, graph.id);
    expect(report.isValid).toBe(false);
    expect(report.cycles).toHaveLength(1);

    await expect(runtime.traversal.dependencyOrder(ORG, graph.id)).rejects.toBeInstanceOf(CyclicDependencyError);

    const { cycles } = await runtime.queries.detectCycles({ organizationId: ORG, graphId: graph.id });
    expect(cycles).toHaveLength(1);
  });

  it('every module is scoped per (organizationId, graphId) end to end', async () => {
    const runtime = createDomainGraphRuntime();
    const graphA = await runtime.graphs.create(ORG, { name: 'A' });
    const graphB = await runtime.graphs.create(ORG, { name: 'B' });

    await runtime.entities.register(ORG, graphA.id, { nodeType: 'organization', entityId: 'o-1' });
    await runtime.entities.register(ORG, graphB.id, { nodeType: 'organization', entityId: 'o-2' });

    const statsA = await runtime.queries.graphStatistics({ organizationId: ORG, graphId: graphA.id });
    const statsB = await runtime.queries.graphStatistics({ organizationId: ORG, graphId: graphB.id });
    expect(statsA.entityCount).toBe(1);
    expect(statsB.entityCount).toBe(1);
  });
});
