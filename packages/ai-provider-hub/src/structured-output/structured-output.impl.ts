/**
 * Real {@link StructuredOutputProvider} implementation — parses a raw model
 * response as JSON and validates it against the caller-supplied Zod schema.
 * Pure and synchronous; making the actual model request that asks for a
 * structured response is the caller's responsibility (e.g. via
 * {@link StreamingChatProvider} with `jsonMode: true}`).
 *
 * @module structured-output/structured-output.impl
 */
import type { z } from 'zod';
import type { StructuredOutputProvider, StructuredOutputResult } from './types.js';

/** Creates a {@link StructuredOutputProvider} that parses and Zod-validates raw model output. */
export function createStructuredOutputProvider(): StructuredOutputProvider {
  return {
    parse<T>(raw: string, schema: z.ZodType<T>): StructuredOutputResult<T> {
      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch (error) {
        return {
          parsed: undefined as T,
          raw,
          valid: false,
          validationErrors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`],
        };
      }

      const result = schema.safeParse(json);
      if (!result.success) {
        return {
          parsed: undefined as T,
          raw,
          valid: false,
          validationErrors: result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
        };
      }

      return { parsed: result.data, raw, valid: true };
    },
  };
}
