import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createToolExecutionFramework } from '../src/tooling/tool-executor.impl.js';

const CONTEXT = { organizationId: 'org-1', runtimeAgentId: 'agent-1' };

describe('createToolExecutionFramework', () => {
  it('executes a registered tool and returns a successful result', async () => {
    const framework = createToolExecutionFramework();
    framework.registerTool({
      descriptor: { toolId: 'echo', name: 'Echo' },
      handler: async (args) => ({ echoed: args }),
    });

    const result = await framework.executeTool(CONTEXT, { toolId: 'echo', input: { text: 'hi' } });
    expect(result.success).toBe(true);
    expect(result.output).toEqual({ echoed: { text: 'hi' } });
  });

  it('returns TOOL_NOT_FOUND for an unregistered tool without throwing', async () => {
    const framework = createToolExecutionFramework();
    const result = await framework.executeTool(CONTEXT, { toolId: 'missing', input: {} });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('TOOL_NOT_FOUND');
  });

  it('validates arguments against a Zod schema and rejects invalid input', async () => {
    const framework = createToolExecutionFramework();
    framework.registerTool({
      descriptor: { toolId: 'typed', name: 'Typed' },
      argumentSchema: z.object({ count: z.number() }),
      handler: async (args) => ({ received: args }),
    });

    const result = await framework.executeTool(CONTEXT, { toolId: 'typed', input: { count: 'not-a-number' } });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('INVALID_ARGUMENTS');
  });

  it('captures a handler throw as EXECUTION_FAILED rather than rejecting', async () => {
    const framework = createToolExecutionFramework();
    framework.registerTool({
      descriptor: { toolId: 'broken', name: 'Broken' },
      handler: async () => {
        throw new Error('boom');
      },
    });

    const result = await framework.executeTool(CONTEXT, { toolId: 'broken', input: {} });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('EXECUTION_FAILED');
  });

  it('times out a slow handler', async () => {
    const framework = createToolExecutionFramework();
    framework.registerTool({
      descriptor: { toolId: 'slow', name: 'Slow' },
      timeoutMs: 20,
      handler: () => new Promise((resolve) => setTimeout(() => resolve({}), 200)),
    });

    const result = await framework.executeTool(CONTEXT, { toolId: 'slow', input: {} });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('EXECUTION_FAILED');
  });

  it('unregisterTool removes a tool from listTools', () => {
    const framework = createToolExecutionFramework();
    framework.registerTool({ descriptor: { toolId: 'a', name: 'A' }, handler: async () => ({}) });
    expect(framework.listTools()).toHaveLength(1);
    framework.unregisterTool('a');
    expect(framework.listTools()).toHaveLength(0);
  });
});
