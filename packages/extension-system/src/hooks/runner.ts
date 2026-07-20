/** @module hooks/runner */
import type { ExtensionManifest } from '../manifest/types.js';
import type { ExtensionLifecycleHooks, HookExecutionResult } from './types.js';

export class HookRunner {
  async runInstall(hooks: ExtensionLifecycleHooks, manifest: ExtensionManifest): Promise<HookExecutionResult> {
    return this.run('onInstall', hooks.onInstall, manifest);
  }

  async runLoad(hooks: ExtensionLifecycleHooks, manifest: ExtensionManifest): Promise<HookExecutionResult> {
    return this.run('onLoad', hooks.onLoad, manifest);
  }

  async runStart(hooks: ExtensionLifecycleHooks, manifest: ExtensionManifest): Promise<HookExecutionResult> {
    return this.run('onStart', hooks.onStart, manifest);
  }

  async runStop(hooks: ExtensionLifecycleHooks, manifest: ExtensionManifest): Promise<HookExecutionResult> {
    return this.run('onStop', hooks.onStop, manifest);
  }

  async runUpdate(
    hooks: ExtensionLifecycleHooks,
    manifest: ExtensionManifest,
    previousVersion: string,
  ): Promise<HookExecutionResult> {
    if (!hooks.onUpdate) return { hook: 'onUpdate', success: true };
    try {
      await hooks.onUpdate(manifest, previousVersion);
      return { hook: 'onUpdate', success: true };
    } catch (error) {
      return {
        hook: 'onUpdate',
        success: false,
        error: error instanceof Error ? error.message : 'Hook failed',
      };
    }
  }

  async runRemove(hooks: ExtensionLifecycleHooks, manifest: ExtensionManifest): Promise<HookExecutionResult> {
    return this.run('onRemove', hooks.onRemove, manifest);
  }

  private async run(
    hook: keyof ExtensionLifecycleHooks,
    fn: ((manifest: ExtensionManifest) => void | Promise<void>) | undefined,
    manifest: ExtensionManifest,
  ): Promise<HookExecutionResult> {
    if (!fn) return { hook, success: true };
    try {
      await fn(manifest);
      return { hook, success: true };
    } catch (error) {
      return { hook, success: false, error: error instanceof Error ? error.message : 'Hook failed' };
    }
  }
}

export function createHookRunner(): HookRunner {
  return new HookRunner();
}
