/** @module loader/extension-loader */
import type { ExtensionManifest } from '../manifest/types.js';
import type { ExtensionRegistry } from '../registry/extension-registry.js';
import type { ExtensionEventBus } from '../events/bus.js';
import type { HookRunner } from '../hooks/runner.js';
import type { ExtensionLifecycleHooks } from '../hooks/types.js';
import { createSandbox } from '../sandbox/enforcer.js';
import { EXTENSION_EVENT_NAMES } from '../events/types.js';

export interface LoadOptions {
  readonly hooks?: ExtensionLifecycleHooks;
  readonly hotReload?: boolean;
}

export class ExtensionLoader {
  private readonly loaded = new Set<string>();

  constructor(
    private readonly registry: ExtensionRegistry,
    private readonly events: ExtensionEventBus,
    private readonly hooks: HookRunner,
  ) {}

  isLoaded(id: string): boolean {
    return this.loaded.has(id);
  }

  async load(id: string, options: LoadOptions = {}): Promise<void> {
    const ext = this.registry.get(id);
    if (!ext) throw new Error(`Extension not installed: ${id}`);

    const lifecycle = this.registry.getLifecycleManager();
    lifecycle.transition(id, 'loading');

    const hookResult = await this.hooks.runLoad(options.hooks ?? {}, ext.manifest);
    if (!hookResult.success) {
      lifecycle.transition(id, 'failed', 'failed', hookResult.error);
      this.events.publish(EXTENSION_EVENT_NAMES.ExtensionFailed, id, {
        error: hookResult.error ?? 'Load hook failed',
        phase: 'load',
      });
      throw new Error(hookResult.error);
    }

    const sandbox = createSandbox(id, ext.manifest.permissions);
    const permCheck = sandbox.assertPermission('cli:register');
    if (permCheck && ext.manifest.commands.length > 0) {
      this.events.publish(EXTENSION_EVENT_NAMES.PermissionDenied, id, {
        permission: 'cli:register',
      });
    }

    lifecycle.transition(id, 'loaded');
    this.loaded.add(id);
    this.events.publish(EXTENSION_EVENT_NAMES.ExtensionLoaded, id, { type: ext.manifest.type });
  }

  async unload(id: string, hooks: ExtensionLifecycleHooks = {}): Promise<void> {
    const ext = this.registry.get(id);
    if (!ext) return;

    await this.hooks.runStop(hooks, ext.manifest);
    this.registry.getLifecycleManager().transition(id, 'stopped');
    this.loaded.delete(id);
  }

  async reload(id: string, options: LoadOptions = {}): Promise<void> {
    await this.unload(id, options.hooks);
    await this.load(id, options);
  }

  listLoaded(): readonly string[] {
    return [...this.loaded];
  }
}

export function createExtensionLoader(
  registry: ExtensionRegistry,
  events: ExtensionEventBus,
  hooks: HookRunner,
): ExtensionLoader {
  return new ExtensionLoader(registry, events, hooks);
}
