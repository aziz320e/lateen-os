/** @module workflow/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import { workflowDefinitionInputSchema, type WorkflowDefinition, type WorkflowDefinitionInput } from './types.js';

export interface WorkflowFactory {
  define(input: WorkflowDefinitionInput): WorkflowDefinition;
}

export function createWorkflowFactory(_context: SDKContext): WorkflowFactory {
  return {
    define(input) {
      const parsed = workflowDefinitionInputSchema.parse(input);
      return { ...parsed, sdkVersion: formatSdkVersion() };
    },
  };
}

export const defineWorkflow = (input: WorkflowDefinitionInput): WorkflowDefinition =>
  createWorkflowFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);
