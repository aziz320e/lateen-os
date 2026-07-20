/** @module registry/types */
import type { ExtensionManifest } from '../manifest/types.js';
import type { ExtensionLifecycleRecord, ExtensionRegistryStatus } from '../lifecycle/types.js';

export interface InstalledExtension {
  readonly manifest: ExtensionManifest;
  readonly path: string;
  readonly installedAt: string;
  readonly status: ExtensionRegistryStatus;
  readonly lifecycle: ExtensionLifecycleRecord;
}

export interface ExtensionRegistrySnapshot {
  readonly extensions: readonly InstalledExtension[];
  readonly enabled: readonly string[];
  readonly disabled: readonly string[];
  readonly failed: readonly string[];
  readonly pending: readonly string[];
}
