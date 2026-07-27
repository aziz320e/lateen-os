/**
 * Pure, dependency-free graph algorithms shared by the real Graph
 * Repository and Traversal Engine: BFS, DFS, shortest path, cycle
 * detection, dependency ordering (topological sort), and connected
 * components. Operate on plain node-id/edge arrays only — no repository,
 * no I/O, fully deterministic.
 *
 * @module graph/algorithms
 */
import { CyclicDependencyError } from '../shared/errors.js';
import type { GraphNodeId } from '../shared/identifiers.js';
import type { DomainRelationshipType, GraphRelationship } from './types.js';

export interface AdjacencyOptions {
  readonly relationshipTypes?: readonly DomainRelationshipType[];
}

function buildDirectedAdjacency(
  relationships: readonly GraphRelationship[],
  options: AdjacencyOptions = {},
): Map<GraphNodeId, GraphNodeId[]> {
  const typeFilter = options.relationshipTypes ? new Set(options.relationshipTypes) : undefined;
  const adjacency = new Map<GraphNodeId, GraphNodeId[]>();
  for (const relationship of relationships) {
    if (typeFilter && !typeFilter.has(relationship.relationshipType)) continue;
    const targets = adjacency.get(relationship.sourceNodeId) ?? [];
    targets.push(relationship.targetNodeId);
    adjacency.set(relationship.sourceNodeId, targets);
  }
  return adjacency;
}

function buildUndirectedAdjacency(relationships: readonly GraphRelationship[]): Map<GraphNodeId, GraphNodeId[]> {
  const adjacency = new Map<GraphNodeId, GraphNodeId[]>();
  const add = (from: GraphNodeId, to: GraphNodeId) => {
    const neighbors = adjacency.get(from) ?? [];
    neighbors.push(to);
    adjacency.set(from, neighbors);
  };
  for (const relationship of relationships) {
    add(relationship.sourceNodeId, relationship.targetNodeId);
    add(relationship.targetNodeId, relationship.sourceNodeId);
  }
  return adjacency;
}

/** Breadth-first traversal from `startNodeId`, in deterministic (sorted-neighbor) visit order. */
export function bfs(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
  startNodeId: GraphNodeId,
  options: AdjacencyOptions & { readonly maxDepth?: number } = {},
): readonly GraphNodeId[] {
  const known = new Set(nodeIds);
  if (!known.has(startNodeId)) return [];
  const adjacency = buildDirectedAdjacency(relationships, options);
  const visited = new Set<GraphNodeId>([startNodeId]);
  const order: GraphNodeId[] = [startNodeId];
  const queue: Array<{ readonly nodeId: GraphNodeId; readonly depth: number }> = [{ nodeId: startNodeId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift() as { readonly nodeId: GraphNodeId; readonly depth: number };
    if (options.maxDepth !== undefined && current.depth >= options.maxDepth) continue;
    const neighbors = [...(adjacency.get(current.nodeId) ?? [])].sort();
    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || !known.has(neighbor)) continue;
      visited.add(neighbor);
      order.push(neighbor);
      queue.push({ nodeId: neighbor, depth: current.depth + 1 });
    }
  }
  return order;
}

/** Depth-first traversal from `startNodeId`, in deterministic (sorted-neighbor) visit order. */
export function dfs(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
  startNodeId: GraphNodeId,
  options: AdjacencyOptions & { readonly maxDepth?: number } = {},
): readonly GraphNodeId[] {
  const known = new Set(nodeIds);
  if (!known.has(startNodeId)) return [];
  const adjacency = buildDirectedAdjacency(relationships, options);
  const visited = new Set<GraphNodeId>();
  const order: GraphNodeId[] = [];

  function visit(nodeId: GraphNodeId, depth: number): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    order.push(nodeId);
    if (options.maxDepth !== undefined && depth >= options.maxDepth) return;
    const neighbors = [...(adjacency.get(nodeId) ?? [])].sort();
    for (const neighbor of neighbors) {
      if (known.has(neighbor)) visit(neighbor, depth + 1);
    }
  }

  visit(startNodeId, 0);
  return order;
}

export interface ShortestPathResult {
  readonly path: readonly GraphNodeId[];
  readonly length: number;
}

/** Unweighted shortest path (BFS-based) between two nodes, or `null` if unreachable. */
export function shortestPath(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
  sourceNodeId: GraphNodeId,
  targetNodeId: GraphNodeId,
  options: AdjacencyOptions = {},
): ShortestPathResult | null {
  const known = new Set(nodeIds);
  if (!known.has(sourceNodeId) || !known.has(targetNodeId)) return null;
  if (sourceNodeId === targetNodeId) return { path: [sourceNodeId], length: 0 };

  const adjacency = buildDirectedAdjacency(relationships, options);
  const visited = new Set<GraphNodeId>([sourceNodeId]);
  const previous = new Map<GraphNodeId, GraphNodeId>();
  const queue: GraphNodeId[] = [sourceNodeId];

  while (queue.length > 0) {
    const current = queue.shift() as GraphNodeId;
    const neighbors = [...(adjacency.get(current) ?? [])].sort();
    for (const neighbor of neighbors) {
      if (visited.has(neighbor) || !known.has(neighbor)) continue;
      visited.add(neighbor);
      previous.set(neighbor, current);
      if (neighbor === targetNodeId) {
        const path: GraphNodeId[] = [targetNodeId];
        let step = targetNodeId;
        while (previous.has(step)) {
          step = previous.get(step) as GraphNodeId;
          path.unshift(step);
        }
        return { path, length: path.length - 1 };
      }
      queue.push(neighbor);
    }
  }
  return null;
}

/** Detects every simple cycle reachable from each node, deduplicated. Deterministic ordering. */
export function detectCycles(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
  options: AdjacencyOptions = {},
): readonly (readonly GraphNodeId[])[] {
  const adjacency = buildDirectedAdjacency(relationships, options);
  const sortedNodeIds = [...nodeIds].sort();
  const cycles: GraphNodeId[][] = [];
  const seenCycleKeys = new Set<string>();

  function canonicalCycleKey(cycle: readonly GraphNodeId[]): string {
    const minIndex = cycle.indexOf([...cycle].sort()[0] as GraphNodeId);
    const rotated = [...cycle.slice(minIndex), ...cycle.slice(0, minIndex)];
    return rotated.join('>');
  }

  function visit(nodeId: GraphNodeId, path: GraphNodeId[], onStack: Set<GraphNodeId>): void {
    path.push(nodeId);
    onStack.add(nodeId);

    const neighbors = [...(adjacency.get(nodeId) ?? [])].sort();
    for (const neighbor of neighbors) {
      if (onStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        const cycle = path.slice(cycleStart);
        const key = canonicalCycleKey(cycle);
        if (!seenCycleKeys.has(key)) {
          seenCycleKeys.add(key);
          cycles.push(cycle);
        }
      } else {
        visit(neighbor, path, onStack);
      }
    }

    path.pop();
    onStack.delete(nodeId);
  }

  for (const nodeId of sortedNodeIds) {
    visit(nodeId, [], new Set());
  }

  return cycles;
}

/** Deterministic topological order (Kahn's algorithm, sorted-degree ties). Throws {@link CyclicDependencyError} if cyclic. */
export function dependencyOrder(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
  options: AdjacencyOptions = {},
): readonly GraphNodeId[] {
  const adjacency = buildDirectedAdjacency(relationships, options);
  const inDegree = new Map<GraphNodeId, number>();
  for (const nodeId of nodeIds) inDegree.set(nodeId, 0);
  for (const [, targets] of adjacency) {
    for (const target of targets) {
      inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
    }
  }

  const ready = [...nodeIds].filter((nodeId) => (inDegree.get(nodeId) ?? 0) === 0).sort();
  const order: GraphNodeId[] = [];
  const remainingInDegree = new Map(inDegree);

  while (ready.length > 0) {
    const nodeId = ready.shift() as GraphNodeId;
    order.push(nodeId);
    const neighbors = [...(adjacency.get(nodeId) ?? [])].sort();
    for (const neighbor of neighbors) {
      const updated = (remainingInDegree.get(neighbor) ?? 0) - 1;
      remainingInDegree.set(neighbor, updated);
      if (updated === 0) {
        ready.push(neighbor);
        ready.sort();
      }
    }
  }

  if (order.length !== nodeIds.length) {
    const cycles = detectCycles(nodeIds, relationships, options);
    throw new CyclicDependencyError(cycles[0] ?? order);
  }
  return order;
}

/** Connected components treating every relationship as undirected, deterministically ordered. */
export function connectedComponents(
  nodeIds: readonly GraphNodeId[],
  relationships: readonly GraphRelationship[],
): readonly (readonly GraphNodeId[])[] {
  const adjacency = buildUndirectedAdjacency(relationships);
  const visited = new Set<GraphNodeId>();
  const components: GraphNodeId[][] = [];

  for (const nodeId of [...nodeIds].sort()) {
    if (visited.has(nodeId)) continue;
    const component: GraphNodeId[] = [];
    const queue: GraphNodeId[] = [nodeId];
    visited.add(nodeId);
    while (queue.length > 0) {
      const current = queue.shift() as GraphNodeId;
      component.push(current);
      const neighbors = [...(adjacency.get(current) ?? [])].sort();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component.sort());
  }
  return components;
}
