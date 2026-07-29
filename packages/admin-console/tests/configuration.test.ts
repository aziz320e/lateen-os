import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { createConfigurationEngine, validateConfigPayload } from '../src/configuration/engine.impl.js';
import { createRuntimeConfigRepository } from '../src/configuration/repository.impl.js';
import { ConfigValidationError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createConfigurationEngine(createRuntimeConfigRepository(), eventBus);
  return { engine, eventBus };
}

describe('validateConfigPayload (pure)', () => {
  it('passes when every required field is present with the right type', () => {
    const result = validateConfigPayload([{ field: 'maxUploadMb', type: 'number', required: true }], { maxUploadMb: 25 });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails when a required field is missing', () => {
    const result = validateConfigPayload([{ field: 'maxUploadMb', type: 'number', required: true }], {});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['"maxUploadMb" is required']);
  });

  it('fails when a present field has the wrong type', () => {
    const result = validateConfigPayload([{ field: 'maxUploadMb', type: 'number', required: true }], { maxUploadMb: 'lots' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must be of type "number"');
  });

  it('an optional missing field does not fail validation', () => {
    const result = validateConfigPayload([{ field: 'label', type: 'string', required: false }], {});
    expect(result.valid).toBe(true);
  });

  it('a null value for a required field is treated as missing', () => {
    const result = validateConfigPayload([{ field: 'maxUploadMb', type: 'number', required: true }], { maxUploadMb: null });
    expect(result.valid).toBe(false);
  });

  it('an empty field list always validates', () => {
    expect(validateConfigPayload([], { anything: 'goes' })).toEqual({ valid: true, errors: [] });
  });
});

describe('ConfigurationEngine', () => {
  it('setRuntimeConfig() creates an organization-wide entry when no environmentId is given', async () => {
    const { engine } = setup();
    const entry = await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    expect(entry.environmentId).toBeUndefined();
    expect(entry.value).toBe(25);
  });

  it('publishes configuration.updated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('configuration.updated', (payload) => (seen = payload));
    const entry = await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    expect(seen).toEqual({ organizationId: ORG, runtimeConfigId: entry.id, key: 'max_upload_mb' });
  });

  it('setRuntimeConfig() creates an environment-scoped override', async () => {
    const { engine } = setup();
    const entry = await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'max_upload_mb', value: 50 });
    expect(entry.environmentId).toBe('env-1');
  });

  it('setRuntimeConfig() called again with the same key updates the existing entry in place', async () => {
    const { engine } = setup();
    const first = await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    const second = await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 100 });
    expect(second.id).toBe(first.id);
    expect(second.value).toBe(100);
    expect((await engine.listConfigs(ORG))).toHaveLength(1);
  });

  it('setRuntimeConfig() validates the payload against a given schema and rejects an invalid one', async () => {
    const { engine } = setup();
    await expect(
      engine.setRuntimeConfig(ORG, { key: 'limits', value: {}, schema: [{ field: 'maxUploadMb', type: 'number', required: true }] }),
    ).rejects.toBeInstanceOf(ConfigValidationError);
  });

  it('setRuntimeConfig() persists a valid payload against a given schema', async () => {
    const { engine } = setup();
    const entry = await engine.setRuntimeConfig(ORG, {
      key: 'limits',
      value: { maxUploadMb: 25 },
      schema: [{ field: 'maxUploadMb', type: 'number', required: true }],
    });
    expect(entry.value).toEqual({ maxUploadMb: 25 });
  });

  it('getEffectiveConfig() prefers the environment override over the organization-wide default', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'max_upload_mb', value: 100 });
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb', 'env-1'))?.value).toBe(100);
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb'))?.value).toBe(25);
  });

  it('getEffectiveConfig() falls back to the organization-wide default when no environment override exists', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb', 'env-without-override'))?.value).toBe(25);
  });

  it('getEffectiveConfig() returns null when nothing is configured', async () => {
    const { engine } = setup();
    expect(await engine.getEffectiveConfig(ORG, 'unknown-key')).toBeNull();
  });

  it('listConfigs() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    await engine.setRuntimeConfig('org-2', { key: 'max_upload_mb', value: 25 });
    expect(await engine.listConfigs(ORG)).toHaveLength(1);
    expect(await engine.listConfigs('org-2')).toHaveLength(1);
  });

  it('an org-wide default and an environment override for the same key coexist as separate entries', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'max_upload_mb', value: 100 });
    expect(await engine.listConfigs(ORG)).toHaveLength(2);
  });

  it('validateConfigPayload validates boolean, object, and array types correctly', () => {
    const schema = [
      { field: 'enabled', type: 'boolean' as const, required: true },
      { field: 'meta', type: 'object' as const, required: true },
      { field: 'tags', type: 'array' as const, required: true },
    ];
    const result = validateConfigPayload(schema, { enabled: true, meta: {}, tags: [] });
    expect(result.valid).toBe(true);
  });

  it('validateConfigPayload accumulates multiple errors', () => {
    const result = validateConfigPayload(
      [
        { field: 'maxUploadMb', type: 'number', required: true },
        { field: 'label', type: 'string', required: true },
      ],
      {},
    );
    expect(result.errors).toHaveLength(2);
  });

  it('ConfigValidationError leaves the original entry untouched when validation fails on an update', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'limits', value: { maxUploadMb: 25 } });
    await expect(
      engine.setRuntimeConfig(ORG, { key: 'limits', value: {}, schema: [{ field: 'maxUploadMb', type: 'number', required: true }] }),
    ).rejects.toBeInstanceOf(ConfigValidationError);
    expect((await engine.getEffectiveConfig(ORG, 'limits'))?.value).toEqual({ maxUploadMb: 25 });
  });

  it('two different environments can each hold their own override for the same key', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-staging', key: 'max_upload_mb', value: 50 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-prod', key: 'max_upload_mb', value: 200 });
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb', 'env-staging'))?.value).toBe(50);
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb', 'env-prod'))?.value).toBe(200);
  });

  it('setRuntimeConfig() supports non-object values such as strings and booleans', async () => {
    const { engine } = setup();
    const stringEntry = await engine.setRuntimeConfig(ORG, { key: 'log_level', value: 'debug' });
    const boolEntry = await engine.setRuntimeConfig(ORG, { key: 'maintenance_mode', value: true });
    expect(stringEntry.value).toBe('debug');
    expect(boolEntry.value).toBe(true);
  });

  it('validateConfigPayload treats 0 and false as present values, not missing', () => {
    const result = validateConfigPayload(
      [
        { field: 'count', type: 'number', required: true },
        { field: 'enabled', type: 'boolean', required: true },
      ],
      { count: 0, enabled: false },
    );
    expect(result.valid).toBe(true);
  });

  it('setRuntimeConfig() without a schema never validates the payload', async () => {
    const { engine } = setup();
    const entry = await engine.setRuntimeConfig(ORG, { key: 'anything', value: { whatever: 'goes' } });
    expect(entry.value).toEqual({ whatever: 'goes' });
  });

  it('configuration entries are keyed independently per key within the same environment', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'a', value: 1 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'b', value: 2 });
    expect(await engine.listConfigs(ORG)).toHaveLength(2);
  });

  it('updating an environment override does not affect the org-wide default for the same key', async () => {
    const { engine } = setup();
    await engine.setRuntimeConfig(ORG, { key: 'max_upload_mb', value: 25 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'max_upload_mb', value: 100 });
    await engine.setRuntimeConfig(ORG, { environmentId: 'env-1', key: 'max_upload_mb', value: 200 });
    expect((await engine.getEffectiveConfig(ORG, 'max_upload_mb'))?.value).toBe(25);
  });

  it('validateConfigPayload with a required array field rejects a non-array value', () => {
    const result = validateConfigPayload([{ field: 'tags', type: 'array', required: true }], { tags: 'not-an-array' });
    expect(result.valid).toBe(false);
  });
});
