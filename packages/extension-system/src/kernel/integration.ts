/** @module kernel/integration */
import type { ExtensionRegistry } from '../registry/extension-registry.js';
import type { ExtensionManifest } from '../manifest/types.js';
import type { ExtensionEventBus } from '../events/bus.js';

export interface KernelPluginRegistration {
  readonly id: string;
  readonly name: string;
  readonly kind: string;
  readonly version: string;
  readonly path: string;
  readonly enabled: boolean;
  readonly dependencies: readonly string[];
}

export interface KernelPluginRegistryPort {
  register(plugin: KernelPluginRegistration): void;
}

const TYPE_TO_PLUGIN_KIND: Record<string, string> = {
  application: 'application',
  service: 'service',
  plugin: 'package',
  connector: 'connector',
  workflow: 'workflow',
  mission: 'mission',
  'ai-worker': 'ai-worker',
  dashboard: 'package',
  widget: 'package',
  theme: 'package',
  'industry-pack': 'package',
};

export interface KernelRegistrationResult {
  readonly registered: readonly string[];
  readonly skipped: readonly string[];
}

export class KernelIntegration {
  registerExtensions(
    extensionRegistry: ExtensionRegistry,
    kernelPlugins: KernelPluginRegistryPort,
  ): KernelRegistrationResult {
    const registered: string[] = [];
    const skipped: string[] = [];

    for (const ext of extensionRegistry.list()) {
      if (ext.status !== 'enabled') {
        skipped.push(ext.manifest.id);
        continue;
      }

      const kind = TYPE_TO_PLUGIN_KIND[ext.manifest.type] ?? 'package';

      try {
        kernelPlugins.register({
          id: `ext-${ext.manifest.id}`,
          name: ext.manifest.displayName,
          kind,
          version: ext.manifest.version,
          path: ext.path,
          enabled: true,
          dependencies: ext.manifest.dependencies.map((d) => `ext-${d.id}`),
        });
        registered.push(ext.manifest.id);
      } catch {
        skipped.push(ext.manifest.id);
      }
    }

    return { registered, skipped };
  }

  wireLifecycleEvents(events: ExtensionEventBus, onHealthCheck?: (id: string) => Promise<boolean>): void {
    events.subscribe('extension.loaded', (event) => {
      void onHealthCheck?.(event.extensionId);
    });

    events.subscribe('extension.failed', (event) => {
      console.error(`[extension-system] ${event.extensionId} failed:`, event.payload);
    });
  }
}

export function createKernelIntegration(): KernelIntegration {
  return new KernelIntegration();
}

export function isSdkCompatible(manifest: ExtensionManifest): boolean {
  const [major, minor] = manifest.sdkVersion.split('.').map(Number);
  return major === 1 && (minor ?? 0) <= 0;
}
