/** @module configuration/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import { sdkConfigInputSchema, type SdkConfigDefinition, type SdkConfigInput } from './types.js';

export interface ConfigFactory {
  define(input: SdkConfigInput): SdkConfigDefinition;
}

export function createConfigFactory(_context: SDKContext): ConfigFactory {
  return {
    define(input) {
      const parsed = sdkConfigInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
  };
}

export const defineConfig = (input: SdkConfigInput): SdkConfigDefinition =>
  createConfigFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);

export { environmentSchema, featureFlagsSchema } from './types.js';
