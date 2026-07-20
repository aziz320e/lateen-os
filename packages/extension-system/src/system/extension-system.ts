/** @module system/extension-system */
import { loadExtensionSystemConfig } from '../configuration/loader.js';
import { createExtensionRegistry, type ExtensionRegistry } from '../registry/extension-registry.js';
import { createExtensionDiscovery, type ExtensionDiscovery } from '../discovery/scanner.js';
import { createExtensionValidator, type ExtensionValidator } from '../validator/extension-validator.js';
import { createExtensionEventBus, type ExtensionEventBus } from '../events/bus.js';
import { createHookRunner, type HookRunner } from '../hooks/runner.js';
import { createExtensionLoader, type ExtensionLoader } from '../loader/extension-loader.js';
import { createExtensionInstaller, type ExtensionInstaller } from '../installer/installer.js';
import { createExtensionQueries, type ExtensionQueries } from '../queries/extension-queries.js';
import { createDependencyResolver, type DependencyResolver } from '../dependencies/resolver.js';
import { createPathResolver, type ExtensionPathResolver } from '../resolver/path-resolver.js';
import { createKernelIntegration, type KernelIntegration } from '../kernel/integration.js';
import { createExtensionLogger, type ExtensionLogger } from './logger.js';
import type { ExtensionSystemConfig } from '../configuration/types.js';

export interface ExtensionSystemOptions {
  readonly workspaceRoot: string;
}

export class ExtensionSystem {
  readonly config: ExtensionSystemConfig;
  readonly logger: ExtensionLogger;
  readonly registry: ExtensionRegistry;
  readonly discovery: ExtensionDiscovery;
  readonly validator: ExtensionValidator;
  readonly events: ExtensionEventBus;
  readonly hooks: HookRunner;
  readonly loader: ExtensionLoader;
  readonly installer: ExtensionInstaller;
  readonly queries: ExtensionQueries;
  readonly dependencies: DependencyResolver;
  readonly paths: ExtensionPathResolver;
  readonly kernel: KernelIntegration;

  constructor(options: ExtensionSystemOptions) {
    this.config = loadExtensionSystemConfig(options.workspaceRoot);
    this.logger = createExtensionLogger(this.config);
    this.registry = createExtensionRegistry();
    this.discovery = createExtensionDiscovery();
    this.validator = createExtensionValidator();
    this.events = createExtensionEventBus();
    this.hooks = createHookRunner();
    this.loader = createExtensionLoader(this.registry, this.events, this.hooks);
    this.installer = createExtensionInstaller(
      this.config,
      this.registry,
      this.validator,
      this.events,
      this.hooks,
    );
    this.queries = createExtensionQueries(
      this.registry,
      this.discovery,
      this.validator,
      options.workspaceRoot,
    );
    this.dependencies = createDependencyResolver();
    this.paths = createPathResolver(this.config);
    this.kernel = createKernelIntegration();
  }

  async discoverAndRegister(): Promise<number> {
    const discovered = await this.discovery.discover({
      workspaceRoot: this.config.workspaceRoot,
      includeMarketplaceCache: true,
    });

    let count = 0;
    for (const item of discovered) {
      const validation = this.validator.validateManifest(item.manifest);
      if (!validation.valid || !validation.manifest) continue;

      if (!this.registry.get(item.manifest.id)) {
        this.registry.install(validation.manifest, item.path);
        count += 1;
      }
    }

    this.logger.info({ discovered: discovered.length, registered: count }, 'extension discovery complete');
    return count;
  }
}

export function createExtensionSystem(workspaceRoot: string): ExtensionSystem {
  return new ExtensionSystem({ workspaceRoot });
}
