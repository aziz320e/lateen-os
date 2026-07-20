/** @module registry/extension-registry */
import type { ExtensionManifest } from '../manifest/types.js';
import { createExtensionLifecycleManager, type ExtensionLifecycleManager } from '../lifecycle/manager.js';
import type { ExtensionRegistryStatus } from '../lifecycle/types.js';
import type { InstalledExtension, ExtensionRegistrySnapshot } from './types.js';

export class ExtensionRegistry {
  private readonly extensions = new Map<string, InstalledExtension>();

  constructor(private readonly lifecycle: ExtensionLifecycleManager = createExtensionLifecycleManager()) {}

  install(manifest: ExtensionManifest, path: string): InstalledExtension {
    if (this.extensions.has(manifest.id)) {
      throw new Error(`Extension already installed: ${manifest.id}`);
    }

    const lifecycle = this.lifecycle.transition(manifest.id, 'installed', 'pending');
    const installed: InstalledExtension = {
      manifest,
      path,
      installedAt: new Date().toISOString(),
      status: 'pending',
      lifecycle,
    };

    this.extensions.set(manifest.id, installed);
    return installed;
  }

  get(id: string): InstalledExtension | undefined {
    return this.extensions.get(id);
  }

  list(): readonly InstalledExtension[] {
    return [...this.extensions.values()];
  }

  enable(id: string): InstalledExtension {
    const ext = this.require(id);
    const lifecycle = this.lifecycle.setStatus(id, 'enabled');
    const updated = { ...ext, status: 'enabled' as const, lifecycle };
    this.extensions.set(id, updated);
    return updated;
  }

  disable(id: string): InstalledExtension {
    const ext = this.require(id);
    const lifecycle = this.lifecycle.setStatus(id, 'disabled');
    const updated = { ...ext, status: 'disabled' as const, lifecycle };
    this.extensions.set(id, updated);
    return updated;
  }

  markFailed(id: string, error: string): InstalledExtension {
    const ext = this.require(id);
    const lifecycle = this.lifecycle.transition(id, 'failed', 'failed', error);
    const updated = { ...ext, status: 'failed' as const, lifecycle };
    this.extensions.set(id, updated);
    return updated;
  }

  remove(id: string): void {
    this.require(id);
    this.lifecycle.remove(id);
    this.extensions.delete(id);
  }

  snapshot(): ExtensionRegistrySnapshot {
    const extensions = this.list();
    const byStatus = (status: ExtensionRegistryStatus) =>
      extensions.filter((e) => e.status === status).map((e) => e.manifest.id);

    return {
      extensions,
      enabled: byStatus('enabled'),
      disabled: byStatus('disabled'),
      failed: byStatus('failed'),
      pending: byStatus('pending'),
    };
  }

  getLifecycleManager(): ExtensionLifecycleManager {
    return this.lifecycle;
  }

  private require(id: string): InstalledExtension {
    const ext = this.extensions.get(id);
    if (!ext) throw new Error(`Extension not found: ${id}`);
    return ext;
  }
}

export function createExtensionRegistry(): ExtensionRegistry {
  return new ExtensionRegistry();
}
