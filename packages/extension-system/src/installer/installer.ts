/** @module installer/installer */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadExtensionManifest } from '../manifest/parser.js';
import type { ExtensionRegistry } from '../registry/extension-registry.js';
import type { ExtensionValidator } from '../validator/extension-validator.js';
import type { ExtensionEventBus } from '../events/bus.js';
import type { HookRunner } from '../hooks/runner.js';
import type { ExtensionLifecycleHooks } from '../hooks/types.js';
import { EXTENSION_EVENT_NAMES } from '../events/types.js';
import type { ExtensionSystemConfig } from '../configuration/types.js';
import { resolveExtensionsPath } from '../configuration/loader.js';

export class ExtensionInstaller {
  constructor(
    private readonly config: ExtensionSystemConfig,
    private readonly registry: ExtensionRegistry,
    private readonly validator: ExtensionValidator,
    private readonly events: ExtensionEventBus,
    private readonly hooks: HookRunner,
  ) {}

  async install(sourcePath: string, hooks: ExtensionLifecycleHooks = {}): Promise<string> {
    const manifest = loadExtensionManifest(sourcePath);
    const validation = this.validator.validateManifest(manifest);
    if (!validation.valid || !validation.manifest) {
      throw new Error(validation.issues.map((i) => i.message).join('; '));
    }

    const lifecycle = this.registry.getLifecycleManager();
    lifecycle.transition(manifest.id, 'installing', 'pending');

    const targetDir = join(resolveExtensionsPath(this.config), manifest.id);
    if (existsSync(targetDir)) {
      rmSync(targetDir, { recursive: true, force: true });
    }
    cpSync(sourcePath, targetDir, { recursive: true });

    await this.hooks.runInstall(hooks, manifest);

    const installed = this.registry.install(manifest, targetDir);
    this.events.publish(EXTENSION_EVENT_NAMES.ExtensionInstalled, manifest.id, {
      version: manifest.version,
      path: targetDir,
    });

    if (this.config.autoEnable) {
      this.registry.enable(manifest.id);
    }

    return installed.manifest.id;
  }

  async remove(id: string, hooks: ExtensionLifecycleHooks = {}): Promise<void> {
    const ext = this.registry.get(id);
    if (!ext) throw new Error(`Extension not found: ${id}`);

    await this.hooks.runRemove(hooks, ext.manifest);
    this.registry.remove(id);
    this.events.publish(EXTENSION_EVENT_NAMES.ExtensionRemoved, id, { version: ext.manifest.version });
  }
}

export function createExtensionInstaller(
  config: ExtensionSystemConfig,
  registry: ExtensionRegistry,
  validator: ExtensionValidator,
  events: ExtensionEventBus,
  hooks: HookRunner,
): ExtensionInstaller {
  return new ExtensionInstaller(config, registry, validator, events, hooks);
}
