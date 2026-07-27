/**
 * Real Search engine — deterministic search by name, type, tags, and
 * metadata. Pure string/value comparisons: no embeddings, no vector
 * search, no AI/LLM.
 *
 * @module search/engine.impl
 */
import type { GraphNode } from '../graph/types.js';
import type { DomainGraphId, OrganizationId } from '../shared/identifiers.js';
import type { GraphRepository } from '../store/graph-repository.js';
import type { EntitySearchMatch, SearchEntitiesQuery } from './types.js';

function readTags(entity: GraphNode): readonly string[] {
  const rawTags = entity.properties?.tags;
  return Array.isArray(rawTags) ? rawTags.filter((tag): tag is string => typeof tag === 'string') : [];
}

function scoreEntity(entity: GraphNode, query: SearchEntitiesQuery): number {
  let score = 0;
  let criteriaGiven = false;

  if (query.name !== undefined) {
    criteriaGiven = true;
    const label = (entity.label ?? '').toLowerCase();
    const needle = query.name.toLowerCase();
    if (label === needle) score += 3;
    else if (label.includes(needle)) score += 2;
  }

  if (query.tags && query.tags.length > 0) {
    criteriaGiven = true;
    const entityTags = new Set(readTags(entity));
    score += query.tags.filter((tag) => entityTags.has(tag)).length;
  }

  if (query.metadata) {
    criteriaGiven = true;
    const properties = entity.properties ?? {};
    for (const [key, value] of Object.entries(query.metadata)) {
      if (properties[key] === value) score += 1;
    }
  }

  return criteriaGiven ? score : 1;
}

export interface GraphSearchEngine {
  search(organizationId: OrganizationId, graphId: DomainGraphId, query: SearchEntitiesQuery): Promise<readonly EntitySearchMatch[]>;
}

/** Creates a real {@link GraphSearchEngine} over a {@link GraphRepository}. */
export function createGraphSearchEngine(graphRepository: GraphRepository): GraphSearchEngine {
  return {
    async search(organizationId, graphId, query) {
      const hasScoredCriteria = query.name !== undefined || (query.tags && query.tags.length > 0) || query.metadata !== undefined;

      const entities = await graphRepository.findEntities(organizationId, graphId, {
        nodeType: query.nodeType,
        status: query.status,
      });

      const matches: EntitySearchMatch[] = [];
      for (const entity of entities) {
        const score = scoreEntity(entity, query);
        if (hasScoredCriteria && score === 0) continue;
        matches.push({ entity, score });
      }

      matches.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.entity.nodeId < b.entity.nodeId ? -1 : a.entity.nodeId > b.entity.nodeId ? 1 : 0;
      });

      return query.limit === undefined ? matches : matches.slice(0, query.limit);
    },
  };
}
