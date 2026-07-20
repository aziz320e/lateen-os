/** @module tool-calling/types */
import { z } from 'zod';

export const toolParameterSchema = z.object({
  type: z.literal('object'),
  properties: z.record(z.object({
    type: z.string(),
    description: z.string().optional(),
    enum: z.array(z.string()).optional(),
  })),
  required: z.array(z.string()).optional(),
});

export const toolDefinitionSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: toolParameterSchema,
});

export const toolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.string(),
});

export const toolResultSchema = z.object({
  toolCallId: z.string(),
  content: z.string(),
  isError: z.boolean().optional(),
});

export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;
export type ToolCall = z.infer<typeof toolCallSchema>;
export type ToolResult = z.infer<typeof toolResultSchema>;

export interface ToolCallingRequest {
  readonly tools: readonly ToolDefinition[];
  readonly toolChoice?: 'auto' | 'none' | 'required' | { readonly name: string };
  readonly parallelToolCalls?: boolean;
}

export interface ToolCallingResult {
  readonly toolCalls: readonly ToolCall[];
  readonly content?: string;
}
