/** @module commands/types */
import { z } from 'zod';

export const slashCommandSchema = z.object({
  command: z.string().regex(/^\/[a-z0-9-]+$/),
  description: z.string().min(1),
  handler: z.string().min(1),
});

export const cliCommandSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  args: z.array(z.string()).default([]),
});

export const assistantCommandSchema = z.object({
  intent: z.string().min(1),
  description: z.string().min(1),
  examples: z.array(z.string()).default([]),
});

export const commandDefinitionInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  slash: slashCommandSchema.optional(),
  cli: cliCommandSchema.optional(),
  assistant: assistantCommandSchema.optional(),
});

export type SlashCommand = z.infer<typeof slashCommandSchema>;
export type CLICommand = z.infer<typeof cliCommandSchema>;
export type AssistantCommand = z.infer<typeof assistantCommandSchema>;
export type CommandDefinitionInput = z.infer<typeof commandDefinitionInputSchema>;

export interface CommandDefinition extends CommandDefinitionInput {
  readonly sdkVersion: string;
}
