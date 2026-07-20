/** @module mission/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import { missionDefinitionInputSchema, type MissionDefinition, type MissionDefinitionInput } from './types.js';

export interface MissionFactory {
  define(input: MissionDefinitionInput): MissionDefinition;
}

export function createMissionFactory(_context: SDKContext): MissionFactory {
  return {
    define(input) {
      const parsed = missionDefinitionInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
  };
}

export const defineMission = (input: MissionDefinitionInput): MissionDefinition =>
  createMissionFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
