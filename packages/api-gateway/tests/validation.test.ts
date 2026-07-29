import { describe, expect, it } from 'vitest';
import { createValidationEngine, normalizeResponse, validateAgainstSchema } from '../src/validation/engine.impl.js';
import { createValidationSchemaRepository } from '../src/validation/repository.impl.js';
import { ValidationSchemaNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createValidationEngine(createValidationSchemaRepository()) };
}

describe('validateAgainstSchema (pure)', () => {
  it('passes when every required field is present with the right type', () => {
    const result = validateAgainstSchema([{ field: 'name', type: 'string', required: true }], { name: 'Acme' });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails when a required field is missing', () => {
    const result = validateAgainstSchema([{ field: 'name', type: 'string', required: true }], {});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['"name" is required']);
  });

  it('fails when a present field has the wrong type', () => {
    const result = validateAgainstSchema([{ field: 'age', type: 'number', required: true }], { age: 'not-a-number' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must be of type "number"');
  });

  it('an optional missing field does not fail validation', () => {
    const result = validateAgainstSchema([{ field: 'nickname', type: 'string', required: false }], {});
    expect(result.valid).toBe(true);
  });

  it('a null value for a required field is treated as missing', () => {
    const result = validateAgainstSchema([{ field: 'name', type: 'string', required: true }], { name: null });
    expect(result.valid).toBe(false);
  });

  it('accumulates multiple errors', () => {
    const result = validateAgainstSchema(
      [
        { field: 'name', type: 'string', required: true },
        { field: 'age', type: 'number', required: true },
      ],
      {},
    );
    expect(result.errors).toHaveLength(2);
  });

  it('validates boolean, object, and array types correctly', () => {
    const schema = [
      { field: 'active', type: 'boolean' as const, required: true },
      { field: 'meta', type: 'object' as const, required: true },
      { field: 'tags', type: 'array' as const, required: true },
    ];
    const result = validateAgainstSchema(schema, { active: true, meta: {}, tags: [] });
    expect(result.valid).toBe(true);
  });

  it('an array value fails an "object" type check', () => {
    const result = validateAgainstSchema([{ field: 'meta', type: 'object', required: true }], { meta: [] });
    expect(result.valid).toBe(false);
  });

  it('an empty field list always validates', () => {
    expect(validateAgainstSchema([], { anything: 'goes' })).toEqual({ valid: true, errors: [] });
  });
});

describe('normalizeResponse (pure)', () => {
  it('produces a success envelope when no errorMessage is given', () => {
    const response = normalizeResponse({ data: { id: 1 }, correlationId: 'corr-1', now: '2026-01-01T00:00:00.000Z' });
    expect(response).toEqual({ success: true, data: { id: 1 }, meta: { correlationId: 'corr-1', timestamp: '2026-01-01T00:00:00.000Z' } });
  });

  it('produces an error envelope when errorMessage is given', () => {
    const response = normalizeResponse({ errorMessage: 'Not found', correlationId: 'corr-1', now: '2026-01-01T00:00:00.000Z' });
    expect(response).toEqual({ success: false, error: { message: 'Not found' }, meta: { correlationId: 'corr-1', timestamp: '2026-01-01T00:00:00.000Z' } });
  });
});

describe('ValidationEngine', () => {
  it('registerSchema() persists request and response schemas', async () => {
    const { engine } = setup();
    const requestSchema = await engine.registerSchema(ORG, { name: 'CreateCustomer', kind: 'request', fields: [{ field: 'name', type: 'string', required: true }] });
    expect(requestSchema.kind).toBe('request');
    const responseSchema = await engine.registerSchema(ORG, { name: 'CustomerResponse', kind: 'response', fields: [] });
    expect(responseSchema.kind).toBe('response');
  });

  it('validate() applies the stored schema to given data', async () => {
    const { engine } = setup();
    const schema = await engine.registerSchema(ORG, { name: 'CreateCustomer', kind: 'request', fields: [{ field: 'name', type: 'string', required: true }] });
    expect((await engine.validate(ORG, schema.id, { name: 'Acme' })).valid).toBe(true);
    expect((await engine.validate(ORG, schema.id, {})).valid).toBe(false);
  });

  it('validate() throws ValidationSchemaNotFoundError for an unknown schema', async () => {
    const { engine } = setup();
    await expect(engine.validate(ORG, 'missing', {})).rejects.toBeInstanceOf(ValidationSchemaNotFoundError);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const schema = await engine.registerSchema(ORG, { name: 'X', kind: 'request', fields: [] });
    expect(await engine.get(ORG, schema.id)).toEqual(schema);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('schemas are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerSchema(ORG, { name: 'X', kind: 'request', fields: [] });
    await engine.registerSchema('org-2', { name: 'X', kind: 'request', fields: [] });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a numeric 0 value for a required field is treated as present, not missing', () => {
    const result = validateAgainstSchema([{ field: 'count', type: 'number', required: true }], { count: 0 });
    expect(result.valid).toBe(true);
  });

  it('an empty string value for a required field is treated as present, not missing', () => {
    const result = validateAgainstSchema([{ field: 'name', type: 'string', required: true }], { name: '' });
    expect(result.valid).toBe(true);
  });

  it('a false boolean value for a required field is treated as present, not missing', () => {
    const result = validateAgainstSchema([{ field: 'active', type: 'boolean', required: true }], { active: false });
    expect(result.valid).toBe(true);
  });

  it('normalizeResponse omits the data field entirely on an error envelope', () => {
    const response = normalizeResponse({ errorMessage: 'Bad request', correlationId: 'corr-1', now: '2026-01-01T00:00:00.000Z' });
    expect('data' in response).toBe(false);
  });

  it('registerSchema() supports response-kind schemas independently from request-kind ones', async () => {
    const { engine } = setup();
    const response = await engine.registerSchema(ORG, { name: 'CustomerResponse', kind: 'response', fields: [{ field: 'id', type: 'string', required: true }] });
    expect((await engine.validate(ORG, response.id, { id: 'customer-1' })).valid).toBe(true);
  });

  it('validateAgainstSchema reports the failing field name for a type mismatch on a nested-looking key', () => {
    const result = validateAgainstSchema([{ field: 'metadata', type: 'object', required: true }], { metadata: 'not-an-object' });
    expect(result.errors).toEqual(['"metadata" must be of type "object", got "string"']);
  });

  it('validateAgainstSchema treats an array as its own distinct type, not "object"', () => {
    const result = validateAgainstSchema([{ field: 'tags', type: 'array', required: true }], { tags: [] });
    expect(result.valid).toBe(true);
    const mismatch = validateAgainstSchema([{ field: 'tags', type: 'object', required: true }], { tags: [] });
    expect(mismatch.valid).toBe(false);
  });

  it('get() returns the registered schema with its full field list intact', async () => {
    const { engine } = setup();
    const fields = [
      { field: 'name', type: 'string' as const, required: true },
      { field: 'age', type: 'number' as const, required: false },
    ];
    const schema = await engine.registerSchema(ORG, { name: 'Person', kind: 'request', fields });
    expect((await engine.get(ORG, schema.id))?.fields).toEqual(fields);
  });

  it('list() reflects every schema registered for the organization', async () => {
    const { engine } = setup();
    await engine.registerSchema(ORG, { name: 'A', kind: 'request', fields: [] });
    await engine.registerSchema(ORG, { name: 'B', kind: 'response', fields: [] });
    expect(await engine.list(ORG)).toHaveLength(2);
  });
});
