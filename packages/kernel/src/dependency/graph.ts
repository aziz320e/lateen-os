/** @module dependency/graph */
import type { PlatformServiceDefinition } from '../registry/types.js';

export interface DependencyNode {
  readonly name: string;
  readonly dependencies: readonly string[];
}

export interface DependencyGraph {
  readonly nodes: readonly DependencyNode[];
}

export class DependencyGraphBuilder {
  build(services: readonly PlatformServiceDefinition[]): DependencyGraph {
    return {
      nodes: services.map((service) => ({
        name: service.name,
        dependencies: [
          ...service.dependencies,
          ...(service.infrastructureDependencies ?? []),
        ],
      })),
    };
  }

  /** Returns service names in topological startup order. */
  resolveStartupOrder(graph: DependencyGraph): readonly string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];
    const nodeMap = new Map(graph.nodes.map((node) => [node.name, node]));

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected at: ${name}`);
      }

      visiting.add(name);
      const node = nodeMap.get(name);
      if (node) {
        for (const dependency of node.dependencies) {
          if (nodeMap.has(dependency)) {
            visit(dependency);
          }
        }
      }
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };

    for (const node of graph.nodes) {
      visit(node.name);
    }

    return order;
  }
}

export function createDependencyGraphBuilder(): DependencyGraphBuilder {
  return new DependencyGraphBuilder();
}
