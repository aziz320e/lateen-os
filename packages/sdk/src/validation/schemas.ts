/** @module validation/schemas */
import { z } from 'zod';

export function createManifestSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema.and(
    z.object({
      sdkVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    }),
  );
}

export function validateSchema<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

export function safeValidateSchema<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown,
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
