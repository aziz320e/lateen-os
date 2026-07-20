/** @module core/types */
import type { SDKVersion } from './version.js';

export type SdkEnvironment = 'development' | 'staging' | 'production' | 'test';

export interface SDKConfiguration {
  readonly workspaceRoot: string;
  readonly environment: SdkEnvironment;
  readonly organizationId?: string;
  readonly packageName?: string;
  readonly featureFlags?: Readonly<Record<string, boolean>>;
}

export interface SDKContext {
  readonly config: SDKConfiguration;
  readonly version: SDKVersion;
  readonly createdAt: string;
}
