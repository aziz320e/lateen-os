/** @module connector/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import { connectorManifestInputSchema, type ConnectorManifest, type ConnectorManifestInput } from './types.js';

export interface ConnectorFactory {
  define(input: ConnectorManifestInput): ConnectorManifest;
}

export function createConnectorFactory(_context: SDKContext): ConnectorFactory {
  return {
    define(input) {
      const parsed = connectorManifestInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
  };
}

export const defineConnector = (input: ConnectorManifestInput): ConnectorManifest =>
  createConnectorFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
