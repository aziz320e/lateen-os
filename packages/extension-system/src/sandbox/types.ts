/** @module sandbox/types */
export interface SandboxLimits {
  readonly maxMemoryMb: number;
  readonly maxExecutionMs: number;
  readonly maxNetworkRequests: number;
  readonly allowedHosts: readonly string[];
}

export interface SandboxContext {
  readonly extensionId: string;
  readonly limits: SandboxLimits;
  readonly grantedPermissions: readonly string[];
}

export interface SandboxViolation {
  readonly code: 'PERMISSION' | 'TIMEOUT' | 'MEMORY' | 'NETWORK';
  readonly message: string;
}

export interface SandboxExecutionResult<T> {
  readonly success: boolean;
  readonly result?: T;
  readonly violation?: SandboxViolation;
  readonly durationMs: number;
}
