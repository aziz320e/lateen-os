/** @module registry/plugin-registry */
import type { PluginDefinition, PluginKind } from './types.js';

const DEFAULT_PLUGINS: readonly PluginDefinition[] = [
  {
    id: 'plugin-apps',
    name: 'Applications',
    kind: 'application',
    version: '1.0.0',
    path: 'apps',
    enabled: true,
    dependencies: [],
  },
  {
    id: 'plugin-services',
    name: 'Services',
    kind: 'service',
    version: '1.0.0',
    path: 'services',
    enabled: true,
    dependencies: [],
  },
  {
    id: 'plugin-packages',
    name: 'Packages',
    kind: 'package',
    version: '1.0.0',
    path: 'packages',
    enabled: true,
    dependencies: [],
  },
  {
    id: 'plugin-ai-workers',
    name: 'AI Workers',
    kind: 'ai-worker',
    version: '1.0.0',
    path: 'packages/ai-workforce',
    enabled: true,
    dependencies: ['plugin-packages'],
  },
  {
    id: 'plugin-connectors',
    name: 'Connectors',
    kind: 'connector',
    version: '1.0.0',
    path: 'services/integration-hub',
    enabled: true,
    dependencies: ['plugin-services'],
  },
  {
    id: 'plugin-workflows',
    name: 'Workflows',
    kind: 'workflow',
    version: '1.0.0',
    path: 'workflows',
    enabled: true,
    dependencies: ['plugin-packages'],
  },
  {
    id: 'plugin-missions',
    name: 'Missions',
    kind: 'mission',
    version: '1.0.0',
    path: 'packages/multi-agent',
    enabled: true,
    dependencies: ['plugin-ai-workers', 'plugin-workflows'],
  },
];

export class PluginRegistry {
  private readonly plugins: Map<string, PluginDefinition>;

  constructor(plugins: readonly PluginDefinition[] = DEFAULT_PLUGINS) {
    this.plugins = new Map(plugins.map((plugin) => [plugin.id, plugin]));
  }

  list(): readonly PluginDefinition[] {
    return [...this.plugins.values()];
  }

  listByKind(kind: PluginKind): readonly PluginDefinition[] {
    return this.list().filter((plugin) => plugin.kind === kind);
  }

  get(id: string): PluginDefinition | undefined {
    return this.plugins.get(id);
  }

  register(plugin: PluginDefinition): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin conflict: ${plugin.id} is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
  }

  enabled(): readonly PluginDefinition[] {
    return this.list().filter((plugin) => plugin.enabled);
  }
}

export function createPluginRegistry(): PluginRegistry {
  return new PluginRegistry();
}
