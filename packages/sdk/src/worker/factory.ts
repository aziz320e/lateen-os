/** @module worker/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import {
  workerProfileInputSchema,
  type WorkerLifecycleHooks,
  type WorkerProfile,
  type WorkerProfileInput,
} from './types.js';

export interface WorkerFactory {
  define(input: WorkerProfileInput): WorkerProfile;
  withLifecycle(profile: WorkerProfile, hooks: WorkerLifecycleHooks): WorkerProfile & { hooks: WorkerLifecycleHooks };
}

export function createWorkerFactory(_context: SDKContext): WorkerFactory {
  return {
    define(input) {
      const parsed = workerProfileInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
    withLifecycle(profile, hooks) {
      return { ...profile, hooks };
    },
  };
}

export const defineWorker = (input: WorkerProfileInput): WorkerProfile =>
  createWorkerFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
