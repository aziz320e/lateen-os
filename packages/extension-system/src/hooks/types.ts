/** @module hooks/types */
import type { ExtensionManifest } from '../manifest/types.js';

export interface ExtensionLifecycleHooks {
  readonly onInstall?: (manifest: ExtensionManifest) => void | Promise<void>;
  readonly onLoad?: (manifest: ExtensionManifest) => void | Promise<void>;
  readonly onStart?: (manifest: ExtensionManifest) => void | Promise<void>;
  readonly onStop?: (manifest: ExtensionManifest) => void | Promise<void>;
  readonly onUpdate?: (manifest: ExtensionManifest, previousVersion: string) => void | Promise<void>;
  readonly onRemove?: (manifest: ExtensionManifest) => void | Promise<void>;
}

export interface HookExecutionResult {
  readonly hook: keyof ExtensionLifecycleHooks;
  readonly success: boolean;
  readonly error?: string;
}
