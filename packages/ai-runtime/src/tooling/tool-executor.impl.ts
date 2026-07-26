/**
 * Real tool execution framework. The existing `tooling/types.ts` only
 * declared DTOs (Tool, ToolCall, ToolResult) with no orchestration
 * surface — this adds the actual registration + execution port agents
 * need to call tools: register a handler with a Zod argument schema,
 * validate input, run with a timeout, and always return a well-formed
 * {@link ToolResult} rather than throwing.
 *
 * @module tooling/tool-executor.impl
 */
import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import type { OrganizationId, RuntimeAgentId, ToolCallId, ToolId } from '../shared/identifiers.js';
import type { ToolDescriptor, ToolResult } from './types.js';

export interface ToolExecutionContext {
  readonly organizationId: OrganizationId;
  readonly runtimeAgentId: RuntimeAgentId;
}

export type ToolHandler<TArgs = unknown> = (
  args: TArgs,
  context: ToolExecutionContext,
) => Promise<Readonly<Record<string, unknown>>>;

export interface RegisteredTool<TArgs = unknown> {
  readonly descriptor: ToolDescriptor;
  /** Validates and types the raw input before the handler runs. Omit for handlers that accept any shape. */
  readonly argumentSchema?: z.ZodType<TArgs>;
  readonly handler: ToolHandler<TArgs>;
  /** Defaults to 30s. */
  readonly timeoutMs?: number;
}

export interface ToolInvocation {
  readonly toolCallId?: ToolCallId;
  readonly toolId: ToolId;
  readonly input: Readonly<Record<string, unknown>>;
}

export interface ToolExecutionFramework {
  registerTool<TArgs>(tool: RegisteredTool<TArgs>): void;
  unregisterTool(toolId: ToolId): void;
  listTools(): readonly ToolDescriptor[];
  /** Always resolves to a ToolResult — validation/timeout/handler failures become `success: false`, never a thrown error. */
  executeTool(context: ToolExecutionContext, invocation: ToolInvocation): Promise<ToolResult>;
}

/** Creates an in-memory {@link ToolExecutionFramework}. */
export function createToolExecutionFramework(): ToolExecutionFramework {
  const tools = new Map<ToolId, RegisteredTool>();

  function failure(toolCallId: ToolCallId | undefined, errorCode: string): ToolResult {
    return { toolCallId: toolCallId ?? randomUUID(), success: false, errorCode, completedAt: new Date().toISOString() };
  }

  return {
    registerTool(tool) {
      tools.set(tool.descriptor.toolId, tool as RegisteredTool);
    },
    unregisterTool(toolId) {
      tools.delete(toolId);
    },
    listTools() {
      return Array.from(tools.values()).map((tool) => tool.descriptor);
    },
    async executeTool(context, invocation) {
      const tool = tools.get(invocation.toolId);
      if (!tool) {
        return failure(invocation.toolCallId, 'TOOL_NOT_FOUND');
      }

      let args: unknown = invocation.input;
      if (tool.argumentSchema) {
        const parsed = tool.argumentSchema.safeParse(invocation.input);
        if (!parsed.success) {
          return failure(invocation.toolCallId, 'INVALID_ARGUMENTS');
        }
        args = parsed.data;
      }

      const timeoutMs = tool.timeoutMs ?? 30_000;
      try {
        const output = await Promise.race([
          tool.handler(args, context),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Tool "${invocation.toolId}" timed out after ${timeoutMs}ms`)), timeoutMs);
          }),
        ]);
        return {
          toolCallId: invocation.toolCallId ?? randomUUID(),
          success: true,
          output,
          completedAt: new Date().toISOString(),
        };
      } catch {
        return failure(invocation.toolCallId, 'EXECUTION_FAILED');
      }
    },
  };
}
