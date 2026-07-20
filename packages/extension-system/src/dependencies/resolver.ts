/** @module dependencies/resolver */
import semver from 'semver';
import type { ExtensionDependency, ExtensionManifest } from '../manifest/types.js';
import { PLATFORM_ENGINE_VERSION, PLATFORM_SDK_VERSION } from '../manifest/types.js';

export interface DependencyIssue {
  readonly code: 'MISSING' | 'INCOMPATIBLE' | 'CYCLE' | 'ENGINE_MISMATCH' | 'SDK_MISMATCH';
  readonly message: string;
  readonly dependencyId?: string;
}

export interface DependencyResolutionResult {
  readonly valid: boolean;
  readonly order: readonly string[];
  readonly issues: readonly DependencyIssue[];
}

export class DependencyResolver {
  resolve(
    target: ExtensionManifest,
    installed: ReadonlyMap<string, ExtensionManifest>,
  ): DependencyResolutionResult {
    const issues: DependencyIssue[] = [];

    if (!semver.satisfies(PLATFORM_ENGINE_VERSION, target.engineVersion)) {
      issues.push({
        code: 'ENGINE_MISMATCH',
        message: `Extension requires engine ${target.engineVersion}, platform is ${PLATFORM_ENGINE_VERSION}`,
      });
    }

    if (!semver.satisfies(PLATFORM_SDK_VERSION, `^${target.sdkVersion.split('.').slice(0, 2).join('.')}.0`)) {
      issues.push({
        code: 'SDK_MISMATCH',
        message: `Extension requires SDK ${target.sdkVersion}, platform SDK is ${PLATFORM_SDK_VERSION}`,
      });
    }

    const graph = new Map<string, readonly ExtensionDependency[]>();
    graph.set(target.id, target.dependencies);

    for (const dep of target.dependencies) {
      const resolved = installed.get(dep.id);
      if (!resolved) {
        issues.push({
          code: 'MISSING',
          message: `Missing dependency: ${dep.id}@${dep.version}`,
          dependencyId: dep.id,
        });
        continue;
      }
      if (!semver.satisfies(resolved.version, dep.version)) {
        issues.push({
          code: 'INCOMPATIBLE',
          message: `Incompatible ${dep.id}: required ${dep.version}, found ${resolved.version}`,
          dependencyId: dep.id,
        });
      }
      graph.set(dep.id, resolved.dependencies);
    }

    let order: string[];
    try {
      order = this.topologicalSort(graph, target.id);
    } catch (error) {
      issues.push({
        code: 'CYCLE',
        message: error instanceof Error ? error.message : 'Circular dependency',
      });
      order = [];
    }

    return {
      valid: issues.length === 0,
      order,
      issues,
    };
  }

  private topologicalSort(
    graph: Map<string, readonly ExtensionDependency[]>,
    root: string,
  ): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (id: string): void => {
      if (visited.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected at: ${id}`);
      }
      visiting.add(id);
      const deps = graph.get(id) ?? [];
      for (const dep of deps) {
        if (graph.has(dep.id)) visit(dep.id);
      }
      visiting.delete(id);
      visited.add(id);
      order.push(id);
    };

    visit(root);
    return order;
  }
}

export function createDependencyResolver(): DependencyResolver {
  return new DependencyResolver();
}
