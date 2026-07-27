import { describe, expect, it, vi } from 'vitest';
import { createEntityRepository } from '../src/store/entity-repository.impl.js';
import { createRelationshipRepository } from '../src/store/relationship-repository.impl.js';
import { createGraphRepository } from '../src/store/graph-repository.impl.js';
import { createEntityRegistry } from '../src/entities/registry.impl.js';
import { createRelationshipEngine } from '../src/relationship-engine/engine.impl.js';
import { createGraphValidationEngine } from '../src/validation/engine.impl.js';
import { createDomainGraphEventBus } from '../src/events/domain-graph-event-bus.js';

const ORG = 'org-1';
const GRAPH = 'graph-1';

function setup(eventBus = createDomainGraphEventBus()) {
  const entityRepository = createEntityRepository();
  const relationshipRepository = createRelationshipRepository();
  const registry = createEntityRegistry(entityRepository);
  const engine = createRelationshipEngine(entityRepository, relationshipRepository);
  const graphRepository = createGraphRepository(entityRepository, relationshipRepository);
  const validation = createGraphValidationEngine(graphRepository, eventBus);
  return { entityRepository, registry, engine, graphRepository, validation };
}

describe('createGraphValidationEngine', () => {
  it('detectDuplicateEntities() finds entities sharing (nodeType, entityId)', async () => {
    const { registry, validation } = setup();
    const first = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    const second = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'unique' });

    const duplicates = await validation.detectDuplicateEntities(ORG, GRAPH);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0]?.nodeIds.sort()).toEqual([first.nodeId, second.nodeId].sort());
  });

  it('detectDuplicateEntities() ignores archived entities', async () => {
    const { registry, validation } = setup();
    const first = await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    await registry.archive(ORG, GRAPH, first.nodeId);

    expect(await validation.detectDuplicateEntities(ORG, GRAPH)).toHaveLength(0);
  });

  it('detectDanglingRelationships() finds relationships whose entity was later archived/removed', async () => {
    const { entityRepository, registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const relationship = await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await entityRepository.delete(ORG, GRAPH, b.nodeId);

    const dangling = await validation.detectDanglingRelationships(ORG, GRAPH);
    expect(dangling).toEqual([{ relationshipId: relationship.relationshipId, missingRole: 'target', missingNodeId: b.nodeId }]);
  });

  it('detectDanglingRelationships() returns nothing for a healthy graph', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    expect(await validation.detectDanglingRelationships(ORG, GRAPH)).toEqual([]);
  });

  it('detectOrphans() finds active entities with no relationships', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    const orphan = await registry.register(ORG, GRAPH, { nodeType: 'lead', entityId: 'l-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const orphans = await validation.detectOrphans(ORG, GRAPH);
    expect(orphans.map((e) => e.nodeId)).toEqual([orphan.nodeId]);
  });

  it('validateAcyclic() finds a real cycle', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    expect(await validation.validateAcyclic(ORG, GRAPH)).toHaveLength(1);
  });

  it('validateAcyclic() can be restricted to specific relationship types', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'related_to', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    expect(await validation.validateAcyclic(ORG, GRAPH, ['depends_on'])).toHaveLength(0);
  });

  it('validate() aggregates every check and reports isValid: true for a healthy graph', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'employee', entityId: 'e-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'department', entityId: 'd-1' });
    await engine.create(ORG, GRAPH, { relationshipType: 'member_of', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });

    const report = await validation.validate(ORG, GRAPH);
    expect(report.isValid).toBe(true);
    expect(report.duplicateEntities).toEqual([]);
    expect(report.danglingRelationships).toEqual([]);
    expect(report.cycles).toEqual([]);
  });

  it('validate() reports isValid: false when duplicates, dangling refs, or cycles exist', async () => {
    const { registry, engine, validation } = setup();
    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });

    const report = await validation.validate(ORG, GRAPH);
    expect(report.isValid).toBe(false);
  });

  it('validate() does not count orphans as invalidating', async () => {
    const { registry, validation } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'lead', entityId: 'l-1' });
    const report = await validation.validate(ORG, GRAPH);
    expect(report.orphanEntities).toHaveLength(1);
    expect(report.isValid).toBe(true);
  });

  it('publishes graph.validated with isValid and issueCount', async () => {
    const eventBus = createDomainGraphEventBus();
    const handler = vi.fn();
    eventBus.subscribe('graph.validated', handler);
    const { registry, engine, validation } = setup(eventBus);

    const a = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-1' });
    const b = await registry.register(ORG, GRAPH, { nodeType: 'workflow', entityId: 'w-2' });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: a.nodeId, targetNodeId: b.nodeId });
    await engine.create(ORG, GRAPH, { relationshipType: 'depends_on', sourceNodeId: b.nodeId, targetNodeId: a.nodeId });
    await validation.validate(ORG, GRAPH);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ graphId: GRAPH, organizationId: ORG, isValid: false, issueCount: 1 }),
      expect.any(Object),
    );
  });

  it('is scoped per (organizationId, graphId)', async () => {
    const { registry, validation } = setup();
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    await registry.register(ORG, GRAPH, { nodeType: 'customer', entityId: 'dup' });
    expect(await validation.detectDuplicateEntities(ORG, 'graph-2')).toHaveLength(0);
  });
});
