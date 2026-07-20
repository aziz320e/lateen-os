/** @module commands/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import { commandDefinitionInputSchema, type CommandDefinition, type CommandDefinitionInput } from './types.js';

export interface CommandFactory {
  define(input: CommandDefinitionInput): CommandDefinition;
}

export function createCommandFactory(_context: SDKContext): CommandFactory {
  return {
    define(input) {
      const parsed = commandDefinitionInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
  };
}

export const defineCommand = (input: CommandDefinitionInput): CommandDefinition =>
  createCommandFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
