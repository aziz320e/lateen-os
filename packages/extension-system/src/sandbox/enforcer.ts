/** @module sandbox/enforcer */
import { checkPermissions, type ExtensionPermission } from '../permissions/index.js';
import type { SandboxContext, SandboxExecutionResult, SandboxLimits, SandboxViolation } from './types.js';

export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = {
  maxMemoryMb: 256,
  maxExecutionMs: 30_000,
  maxNetworkRequests: 100,
  allowedHosts: ['localhost', '127.0.0.1'],
};

export class SandboxEnforcer {
  constructor(private readonly context: SandboxContext) {}

  assertPermission(permission: string): SandboxViolation | undefined {
    const result = checkPermissions(
      [permission],
      this.context.grantedPermissions as ExtensionPermission[],
    );
    if (!result.allowed) {
      return { code: 'PERMISSION', message: `Permission denied: ${permission}` };
    }
    return undefined;
  }

  async execute<T>(fn: () => Promise<T>): Promise<SandboxExecutionResult<T>> {
    const started = Date.now();
    const timeoutMs = this.context.limits.maxExecutionMs;

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Sandbox timeout')), timeoutMs),
        ),
      ]);

      return { success: true, result, durationMs: Date.now() - started };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sandbox execution failed';
      const violation: SandboxViolation =
        message.includes('timeout') ? { code: 'TIMEOUT', message } : { code: 'PERMISSION', message };

      return { success: false, violation, durationMs: Date.now() - started };
    }
  }
}

export function createSandbox(extensionId: string, grantedPermissions: readonly string[]): SandboxEnforcer {
  return new SandboxEnforcer({
    extensionId,
    limits: DEFAULT_SANDBOX_LIMITS,
    grantedPermissions,
  });
}
