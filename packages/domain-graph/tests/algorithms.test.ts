import { describe, expect, it } from 'vitest';
import {
  bfs,
  connectedComponents,
  dependencyOrder,
  detectCycles,
  dfs,
  shortestPath,
} from '../src/graph/algorithms.js';
import { CyclicDependencyError } from '../src/shared/errors.js';
import type { DomainRelationshipType, GraphRelationship } from '../src/graph/types.js';

let counter = 0;
function rel(source: string, target: string, relationshipType: DomainRelationshipType = 'depends_on'): GraphRelationship {
  counter += 1;
  return {
    relationshipId: `rel-${counter}`,
    organizationId: 'org-1',
    graphId: 'graph-1',
    relationshipType,
    sourceNodeId: source,
    targetNodeId: target,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

describe('bfs', () => {
  it('visits reachable nodes in breadth-first order', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('a', 'c'), rel('b', 'd')];
    expect(bfs(nodes, edges, 'a')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not visit unreachable nodes', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b')];
    expect(bfs(nodes, edges, 'a')).toEqual(['a', 'b']);
  });

  it('respects maxDepth', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c')];
    expect(bfs(nodes, edges, 'a', { maxDepth: 1 })).toEqual(['a', 'b']);
  });

  it('returns an empty array for an unknown start node', () => {
    expect(bfs(['a'], [], 'missing')).toEqual([]);
  });

  it('filters by relationshipTypes', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b', 'depends_on'), rel('a', 'c', 'related_to')];
    expect(bfs(nodes, edges, 'a', { relationshipTypes: ['depends_on'] })).toEqual(['a', 'b']);
  });

  it('handles cycles without infinite looping', () => {
    const nodes = ['a', 'b'];
    const edges = [rel('a', 'b'), rel('b', 'a')];
    expect(bfs(nodes, edges, 'a')).toEqual(['a', 'b']);
  });

  it('is deterministic regardless of edge insertion order', () => {
    const nodes = ['a', 'b', 'c'];
    const edgesOne = [rel('a', 'c'), rel('a', 'b')];
    const edgesTwo = [rel('a', 'b'), rel('a', 'c')];
    expect(bfs(nodes, edgesOne, 'a')).toEqual(bfs(nodes, edgesTwo, 'a'));
  });
});

describe('dfs', () => {
  it('visits reachable nodes in depth-first order', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('a', 'c'), rel('b', 'd')];
    expect(dfs(nodes, edges, 'a')).toEqual(['a', 'b', 'd', 'c']);
  });

  it('respects maxDepth', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c')];
    expect(dfs(nodes, edges, 'a', { maxDepth: 1 })).toEqual(['a', 'b']);
  });

  it('returns an empty array for an unknown start node', () => {
    expect(dfs(['a'], [], 'missing')).toEqual([]);
  });

  it('handles cycles without infinite looping', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c'), rel('c', 'a')];
    expect(dfs(nodes, edges, 'a')).toEqual(['a', 'b', 'c']);
  });
});

describe('shortestPath', () => {
  it('finds the shortest path between two connected nodes', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('b', 'c'), rel('a', 'd'), rel('d', 'c')];
    const result = shortestPath(nodes, edges, 'a', 'c');
    expect(result?.length).toBe(2);
    expect(result?.path).toEqual(['a', 'b', 'c']);
  });

  it('returns a zero-length path when source equals target', () => {
    expect(shortestPath(['a'], [], 'a', 'a')).toEqual({ path: ['a'], length: 0 });
  });

  it('returns null when unreachable', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b')];
    expect(shortestPath(nodes, edges, 'a', 'c')).toBeNull();
  });

  it('returns null for an unknown source or target', () => {
    expect(shortestPath(['a', 'b'], [rel('a', 'b')], 'missing', 'b')).toBeNull();
    expect(shortestPath(['a', 'b'], [rel('a', 'b')], 'a', 'missing')).toBeNull();
  });

  it('prefers the shorter of two paths of different lengths', () => {
    const nodes = ['a', 'b', 'c', 'd', 'e'];
    const edges = [rel('a', 'b'), rel('b', 'c'), rel('c', 'e'), rel('a', 'd'), rel('d', 'e')];
    const result = shortestPath(nodes, edges, 'a', 'e');
    expect(result?.length).toBe(2);
  });
});

describe('detectCycles', () => {
  it('detects a simple cycle', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c'), rel('c', 'a')];
    const cycles = detectCycles(nodes, edges);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array for an acyclic graph', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c')];
    expect(detectCycles(nodes, edges)).toEqual([]);
  });

  it('deduplicates the same cycle found from different starting nodes', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c'), rel('c', 'a')];
    expect(detectCycles(nodes, edges)).toHaveLength(1);
  });

  it('respects relationshipTypes filtering', () => {
    const nodes = ['a', 'b'];
    const edges = [rel('a', 'b', 'depends_on'), rel('b', 'a', 'related_to')];
    expect(detectCycles(nodes, edges, { relationshipTypes: ['depends_on'] })).toEqual([]);
    expect(detectCycles(nodes, edges)).toHaveLength(1);
  });

  it('finds multiple independent cycles', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('b', 'a'), rel('c', 'd'), rel('d', 'c')];
    expect(detectCycles(nodes, edges)).toHaveLength(2);
  });
});

describe('dependencyOrder', () => {
  it('returns a valid topological order for a DAG', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b'), rel('b', 'c')];
    expect(dependencyOrder(nodes, edges)).toEqual(['a', 'b', 'c']);
  });

  it('is deterministic for nodes with equal in-degree (sorted ties)', () => {
    const nodes = ['c', 'a', 'b'];
    const edges: GraphRelationship[] = [];
    expect(dependencyOrder(nodes, edges)).toEqual(['a', 'b', 'c']);
  });

  it('throws CyclicDependencyError when the graph is cyclic', () => {
    const nodes = ['a', 'b'];
    const edges = [rel('a', 'b'), rel('b', 'a')];
    expect(() => dependencyOrder(nodes, edges)).toThrow(CyclicDependencyError);
  });

  it('orders a diamond dependency correctly', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('a', 'c'), rel('b', 'd'), rel('c', 'd')];
    const order = dependencyOrder(nodes, edges);
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('d'));
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('d'));
  });

  it('respects relationshipTypes filtering to ignore non-dependency edges', () => {
    const nodes = ['a', 'b'];
    const edges = [rel('a', 'b', 'depends_on'), rel('b', 'a', 'related_to')];
    expect(dependencyOrder(nodes, edges, { relationshipTypes: ['depends_on'] })).toEqual(['a', 'b']);
  });
});

describe('connectedComponents', () => {
  it('groups connected nodes together', () => {
    const nodes = ['a', 'b', 'c', 'd'];
    const edges = [rel('a', 'b'), rel('c', 'd')];
    const components = connectedComponents(nodes, edges);
    expect(components).toEqual([['a', 'b'], ['c', 'd']]);
  });

  it('treats every relationship as undirected', () => {
    const nodes = ['a', 'b'];
    const edges = [rel('b', 'a')];
    expect(connectedComponents(nodes, edges)).toEqual([['a', 'b']]);
  });

  it('puts isolated nodes in their own singleton component', () => {
    const nodes = ['a', 'b', 'c'];
    const edges = [rel('a', 'b')];
    expect(connectedComponents(nodes, edges)).toEqual([['a', 'b'], ['c']]);
  });

  it('returns one component per node when there are no edges', () => {
    const nodes = ['b', 'a'];
    expect(connectedComponents(nodes, [])).toEqual([['a'], ['b']]);
  });
});
