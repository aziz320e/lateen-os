/**
 * Real Graph Lifecycle — the `DomainGraph` container's guarded state
 * machine: create / update / archive / restore, plus a `rebuild` signal
 * used by maintenance/reindex operations.
 *
 * @module graph/lifecycle.impl
 */
import type { DomainGraphEventBus } from '../events/domain-graph-event-bus.js';
import { DomainGraphNotFoundError, InvalidGraphTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DomainGraphId, OrganizationId } from '../shared/identifiers.js';
import type { DomainGraphRepository } from './repository.js';
import type { DomainGraph, DomainGraphStatus } from './types.js';

const GRAPH_TRANSITIONS: Readonly<Record<DomainGraphStatus, readonly DomainGraphStatus[]>> = {
  active: ['archived'],
  archived: ['active'],
};

export function canTransitionGraph(from: DomainGraphStatus, to: DomainGraphStatus): boolean {
  return GRAPH_TRANSITIONS[from].includes(to);
}

export interface CreateDomainGraphInput {
  readonly name: string;
  readonly description?: string;
  readonly schemaVersion?: string;
}

export interface UpdateDomainGraphInput {
  readonly name?: string;
  readonly description?: string;
}

export interface RebuildStats {
  readonly entityCount: number;
  readonly relationshipCount: number;
}

export interface GraphLifecycle {
  create(organizationId: OrganizationId, input: CreateDomainGraphInput): Promise<DomainGraph>;
  update(organizationId: OrganizationId, graphId: DomainGraphId, patch: UpdateDomainGraphInput): Promise<DomainGraph>;
  archive(organizationId: OrganizationId, graphId: DomainGraphId): Promise<DomainGraph>;
  restore(organizationId: OrganizationId, graphId: DomainGraphId): Promise<DomainGraph>;
  /** Stamps the graph as rebuilt and publishes `graph.rebuilt` with the given (externally computed) stats. */
  rebuild(organizationId: OrganizationId, graphId: DomainGraphId, stats: RebuildStats): Promise<DomainGraph>;
  transition(organizationId: OrganizationId, graphId: DomainGraphId, to: DomainGraphStatus): Promise<DomainGraph>;
  get(organizationId: OrganizationId, graphId: DomainGraphId): Promise<DomainGraph | null>;
  list(organizationId: OrganizationId): Promise<readonly DomainGraph[]>;
}

/** Creates a real {@link GraphLifecycle} backed by a {@link DomainGraphRepository}. */
export function createGraphLifecycle(
  repository: DomainGraphRepository,
  eventBus?: DomainGraphEventBus,
  now: () => string = nowIso,
): GraphLifecycle {
  async function requireGraph(organizationId: OrganizationId, graphId: DomainGraphId): Promise<DomainGraph> {
    const graph = await repository.findById(organizationId, graphId);
    if (!graph) throw new DomainGraphNotFoundError(graphId);
    return graph;
  }

  async function transition(organizationId: OrganizationId, graphId: DomainGraphId, to: DomainGraphStatus): Promise<DomainGraph> {
    const graph = await requireGraph(organizationId, graphId);
    if (!canTransitionGraph(graph.status, to)) {
      throw new InvalidGraphTransitionError(graphId, graph.status, to);
    }
    const updated: DomainGraph = { ...graph, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const graph: DomainGraph = {
        id: generateId('domain-graph'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        description: input.description,
        status: 'active',
        schemaVersion: input.schemaVersion ?? '1.0.0',
      };
      await repository.save(graph);
      return graph;
    },

    async update(organizationId, graphId, patch) {
      const graph = await requireGraph(organizationId, graphId);
      if (graph.status === 'archived') {
        throw new InvalidGraphTransitionError(graphId, graph.status, 'updated');
      }
      const updated: DomainGraph = { ...graph, ...patch, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, graphId) {
      return transition(organizationId, graphId, 'archived');
    },

    async restore(organizationId, graphId) {
      return transition(organizationId, graphId, 'active');
    },

    async rebuild(organizationId, graphId, stats) {
      const graph = await requireGraph(organizationId, graphId);
      const updated: DomainGraph = { ...graph, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('graph.rebuilt', {
        graphId,
        organizationId,
        entityCount: stats.entityCount,
        relationshipCount: stats.relationshipCount,
      });
      return updated;
    },

    transition,

    async get(organizationId, graphId) {
      return repository.findById(organizationId, graphId);
    },

    async list(organizationId) {
      return repository.findByOrganization(organizationId);
    },
  };
}
