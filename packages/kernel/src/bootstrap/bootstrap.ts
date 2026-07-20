/** @module bootstrap/bootstrap */
import { loadKernelConfig } from '../configuration/loader.js';
import { createDependencyGraphBuilder } from '../dependency/graph.js';
import { validateEnvironment } from '../environment/validator.js';
import { createKernelEventBus } from '../events/bus.js';
import { createPluginLoader } from '../plugins/loader.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';
import { resolveWorkspace } from '../workspace/resolver.js';
import { createKernelLogger } from './logger.js';
import { initKernelTelemetry } from './telemetry.js';
import type { BootstrapResult } from './types.js';

export interface BootstrapOptions {
  readonly workspaceRoot?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export async function bootstrapPlatform(options: BootstrapOptions = {}): Promise<BootstrapResult> {
  const workspace = resolveWorkspace(options.workspaceRoot);
  const config = loadKernelConfig({ workspaceRoot: workspace.root, env: options.env });
  const logger = createKernelLogger(config);
  const events = createKernelEventBus();

  events.emit('kernel.bootstrapping', { workspaceRoot: workspace.root });

  initKernelTelemetry(config);

  const environment = validateEnvironment(config, options.env);
  const builder = createDependencyGraphBuilder();
  const graph = builder.build([
    ...PLATFORM_MANIFEST.infrastructure,
    ...PLATFORM_MANIFEST.services,
  ]);
  const startupOrder = builder.resolveStartupOrder(graph);

  const pluginLoader = createPluginLoader(config);
  const plugins = pluginLoader.load();

  for (const plugin of plugins.loaded) {
    events.emit('kernel.plugin.loaded', { pluginId: plugin.id, kind: plugin.kind });
  }

  logger.info(
    {
      environment: config.environment,
      services: PLATFORM_MANIFEST.services.length,
      applications: PLATFORM_MANIFEST.applications.length,
      plugins: plugins.loaded.length,
    },
    'Lateen Kernel bootstrapped',
  );

  events.emit('kernel.bootstrapped', {
    valid: environment.valid,
    startupOrder,
  });

  return {
    config,
    logger,
    events,
    startupOrder,
    plugins,
    environment,
  };
}
