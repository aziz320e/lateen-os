/**
 * Real Validation engine — duplicate entity detection, dangling
 * relationship detection, orphan detection, and cycle validation. Pure
 * read-only checks over the {@link GraphRepository}; `validate()` is the
 * only method that publishes an event (`graph.validated`).
 *
 * @module validation/engine.impl
 */
import { detectCycles } from '../graph/algorithms.js';
import type { DomainRelationshipType, GraphNode } from '../graph/types.js';
import type { DomainGraphEventBus } from '../events/domain-graph-event-bus.js';
import type { DomainGraphId, GraphNodeId, OrganizationId } from '../shared/identifiers.js';
import type { GraphRepository } from '../store/graph-repository.js';
import type { DanglingRelationshipReport, DuplicateEntityGroup, GraphValidationReport } from './types.js';

export interface GraphValidationEngine {
  detectDuplicateEntities(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly DuplicateEntityGroup[]>;
  detectDanglingRelationships(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly DanglingRelationshipReport[]>;
  detectOrphans(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphNode[]>;
  validateAcyclic(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    relationshipTypes?: readonly DomainRelationshipType[],
  ): Promise<readonly (readonly GraphNodeId[])[]>;
  /** Runs every check, aggregates a report, and publishes `graph.validated`. */
  validate(organizationId: OrganizationId, graphId: DomainGraphId): Promise<GraphValidationReport>;
}

/** Creates a real {@link GraphValidationEngine} over a {@link GraphRepository}. */
export function createGraphValidationEngine(graphRepository: GraphRepository, eventBus?: DomainGraphEventBus): GraphValidationEngine {
  async function detectDuplicateEntities(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly DuplicateEntityGroup[]> {
    const entities = await graphRepository.findEntities(organizationId, graphId, { status: 'active' });
    const groups = new Map<string, DuplicateEntityGroup>();
    for (const entity of entities) {
      const key = `${entity.nodeType}::${entity.entityId}`;
      const existing = groups.get(key);
      if (existing) {
        groups.set(key, { ...existing, nodeIds: [...existing.nodeIds, entity.nodeId] });
      } else {
        groups.set(key, { nodeType: entity.nodeType, entityId: entity.entityId, nodeIds: [entity.nodeId] });
      }
    }
    return [...groups.values()].filter((group) => group.nodeIds.length > 1);
  }

  async function detectDanglingRelationships(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
  ): Promise<readonly DanglingRelationshipReport[]> {
    const entities = await graphRepository.findEntities(organizationId, graphId);
    const relationships = await graphRepository.findRelationships(organizationId, graphId);
    const knownIds = new Set(entities.map((entity) => entity.nodeId));

    const reports: DanglingRelationshipReport[] = [];
    for (const relationship of relationships) {
      if (!knownIds.has(relationship.sourceNodeId)) {
        reports.push({ relationshipId: relationship.relationshipId, missingRole: 'source', missingNodeId: relationship.sourceNodeId });
      }
      if (!knownIds.has(relationship.targetNodeId)) {
        reports.push({ relationshipId: relationship.relationshipId, missingRole: 'target', missingNodeId: relationship.targetNodeId });
      }
    }
    return reports;
  }

  async function detectOrphans(organizationId: OrganizationId, graphId: DomainGraphId): Promise<readonly GraphNode[]> {
    const entities = await graphRepository.findEntities(organizationId, graphId, { status: 'active' });
    const relationships = await graphRepository.findRelationships(organizationId, graphId);
    const connected = new Set<GraphNodeId>();
    for (const relationship of relationships) {
      connected.add(relationship.sourceNodeId);
      connected.add(relationship.targetNodeId);
    }
    return entities.filter((entity) => !connected.has(entity.nodeId));
  }

  async function validateAcyclic(
    organizationId: OrganizationId,
    graphId: DomainGraphId,
    relationshipTypes?: readonly DomainRelationshipType[],
  ): Promise<readonly (readonly GraphNodeId[])[]> {
    const entities = await graphRepository.findEntities(organizationId, graphId);
    const relationships = await graphRepository.findRelationships(organizationId, graphId);
    return detectCycles(
      entities.map((entity) => entity.nodeId),
      relationships,
      relationshipTypes ? { relationshipTypes } : {},
    );
  }

  return {
    detectDuplicateEntities,
    detectDanglingRelationships,
    detectOrphans,
    validateAcyclic,

    async validate(organizationId, graphId) {
      const [duplicateEntities, danglingRelationships, orphanEntities, cycles] = await Promise.all([
        detectDuplicateEntities(organizationId, graphId),
        detectDanglingRelationships(organizationId, graphId),
        detectOrphans(organizationId, graphId),
        validateAcyclic(organizationId, graphId),
      ]);

      const issueCount = duplicateEntities.length + danglingRelationships.length + cycles.length;
      const report: GraphValidationReport = {
        duplicateEntities,
        danglingRelationships,
        orphanEntities,
        cycles,
        isValid: issueCount === 0,
      };
      eventBus?.publish('graph.validated', { graphId, organizationId, isValid: report.isValid, issueCount });
      return report;
    },
  };
}
