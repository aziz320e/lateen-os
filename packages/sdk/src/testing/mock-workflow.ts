/** @module testing/mock-workflow */
import type { WorkflowDefinition } from '../workflow/types.js';

export function createMockWorkflow(overrides: Partial<WorkflowDefinition> = {}): WorkflowDefinition {
  return {
    code: 'mock-workflow',
    name: 'Mock Workflow',
    description: 'Test workflow',
    category: 'custom',
    steps: [{ id: 'step-1', name: 'Start', type: 'task', order: 0 }],
    triggers: [{ type: 'manual', config: {} }],
    sdkVersion: '1.0.0',
    ...overrides,
  };
}
