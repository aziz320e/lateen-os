import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createStructuredOutputProvider } from '../src/structured-output/structured-output.impl.js';

const personSchema = z.object({ name: z.string(), age: z.number() });

describe('createStructuredOutputProvider', () => {
  it('parses and validates well-formed JSON against the schema', () => {
    const provider = createStructuredOutputProvider();
    const result = provider.parse('{"name":"Ada","age":30}', personSchema);
    expect(result.valid).toBe(true);
    expect(result.parsed).toEqual({ name: 'Ada', age: 30 });
    expect(result.validationErrors).toBeUndefined();
  });

  it('reports invalid JSON without throwing', () => {
    const provider = createStructuredOutputProvider();
    const result = provider.parse('not json', personSchema);
    expect(result.valid).toBe(false);
    expect(result.validationErrors?.[0]).toMatch(/Invalid JSON/);
  });

  it('reports schema validation errors for well-formed JSON that does not match', () => {
    const provider = createStructuredOutputProvider();
    const result = provider.parse('{"name":"Ada"}', personSchema);
    expect(result.valid).toBe(false);
    expect(result.validationErrors?.length).toBeGreaterThan(0);
  });

  it('preserves the raw string on both success and failure', () => {
    const provider = createStructuredOutputProvider();
    const raw = '{"name":"Ada","age":30}';
    expect(provider.parse(raw, personSchema).raw).toBe(raw);
    expect(provider.parse('bad', personSchema).raw).toBe('bad');
  });
});
