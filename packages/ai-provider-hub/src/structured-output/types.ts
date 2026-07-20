/** @module structured-output/types */
import { z } from 'zod';

export const structuredOutputRequestSchema = z.object({
  schema: z.record(z.unknown()),
  schemaName: z.string().optional(),
  strict: z.boolean().default(true),
});

export type StructuredOutputRequest = z.infer<typeof structuredOutputRequestSchema>;

export interface StructuredOutputResult<T = unknown> {
  readonly parsed: T;
  readonly raw: string;
  readonly valid: boolean;
  readonly validationErrors?: readonly string[];
}

export interface StructuredOutputProvider {
  parse<T>(raw: string, schema: z.ZodType<T>): StructuredOutputResult<T>;
}
