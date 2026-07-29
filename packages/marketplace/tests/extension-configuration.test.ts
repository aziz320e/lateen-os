import { describe, expect, it } from 'vitest';
import { createExtensionConfigurationEngine, validateExtensionConfig } from '../src/extension-configuration/engine.impl.js';
import { createExtensionConfigRepository } from '../src/extension-configuration/repository.impl.js';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { ConfigValidationError } from '../src/shared/errors.js';

const ORG = 'org-1';
const EXT = 'ext-1';

function setup() {
  const eventBus = createMarketplaceEventBus();
  const engine = createExtensionConfigurationEngine(createExtensionConfigRepository(), eventBus);
  return { engine, eventBus };
}

describe('validateExtensionConfig (pure)', () => {
  it('passes when every required field is present with the right type', () => {
    const result = validateExtensionConfig([{ field: 'apiKey', type: 'string', required: true }], { apiKey: 'secret' });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails when a required field is missing', () => {
    const result = validateExtensionConfig([{ field: 'apiKey', type: 'string', required: true }], {});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(['"apiKey" is required']);
  });

  it('fails when a present field has the wrong type', () => {
    const result = validateExtensionConfig([{ field: 'timeout', type: 'number', required: true }], { timeout: 'slow' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must be of type "number"');
  });

  it('an optional missing field does not fail validation', () => {
    const result = validateExtensionConfig([{ field: 'label', type: 'string', required: false }], {});
    expect(result.valid).toBe(true);
  });

  it('0, empty string, and false are treated as present, not missing', () => {
    const result = validateExtensionConfig(
      [
        { field: 'count', type: 'number', required: true },
        { field: 'label', type: 'string', required: true },
        { field: 'enabled', type: 'boolean', required: true },
      ],
      { count: 0, label: '', enabled: false },
    );
    expect(result.valid).toBe(true);
  });
});

describe('ExtensionConfigurationEngine', () => {
  it('setDefault() creates a non-override entry', async () => {
    const { engine } = setup();
    const entry = await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    expect(entry.isOverride).toBe(false);
    expect(entry.value).toBe(30);
  });

  it('setOverride() creates an override entry', async () => {
    const { engine } = setup();
    const entry = await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    expect(entry.isOverride).toBe(true);
  });

  it('publishes configuration.changed on setDefault and setOverride', async () => {
    const { engine, eventBus } = setup();
    const seen: unknown[] = [];
    eventBus.subscribe('configuration.changed', (payload) => seen.push(payload));
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    expect(seen).toHaveLength(2);
  });

  it('setDefault() called twice for the same key updates the entry in place', async () => {
    const { engine } = setup();
    const first = await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    const second = await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 45 });
    expect(second.id).toBe(first.id);
    expect(second.value).toBe(45);
  });

  it('the default and the override for the same key coexist as separate entries', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    expect(await engine.listConfigsForExtension(ORG, EXT)).toHaveLength(2);
  });

  it('setDefault() with a schema validates the payload and rejects an invalid one', async () => {
    const { engine } = setup();
    await expect(
      engine.setDefault(ORG, { extensionId: EXT, key: 'settings', value: {}, schema: [{ field: 'apiKey', type: 'string', required: true }] }),
    ).rejects.toBeInstanceOf(ConfigValidationError);
  });

  it('setDefault() with a schema persists a valid payload', async () => {
    const { engine } = setup();
    const entry = await engine.setDefault(ORG, {
      extensionId: EXT,
      key: 'settings',
      value: { apiKey: 'secret' },
      schema: [{ field: 'apiKey', type: 'string', required: true }],
    });
    expect(entry.value).toEqual({ apiKey: 'secret' });
  });

  it('getEffectiveConfig() prefers the override over the default', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    expect((await engine.getEffectiveConfig(ORG, EXT, 'timeout'))?.value).toBe(60);
  });

  it('getEffectiveConfig() falls back to the default when no override exists', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    expect((await engine.getEffectiveConfig(ORG, EXT, 'timeout'))?.value).toBe(30);
  });

  it('getEffectiveConfig() returns null when nothing is configured', async () => {
    const { engine } = setup();
    expect(await engine.getEffectiveConfig(ORG, EXT, 'unknown-key')).toBeNull();
  });

  it('listConfigsForExtension() is isolated per extension', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: 'ext-a', key: 'timeout', value: 30 });
    await engine.setDefault(ORG, { extensionId: 'ext-b', key: 'timeout', value: 60 });
    expect(await engine.listConfigsForExtension(ORG, 'ext-a')).toHaveLength(1);
  });

  it('configuration entries are isolated per organization', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setDefault('org-2', { extensionId: EXT, key: 'timeout', value: 30 });
    expect(await engine.listConfigsForExtension(ORG, EXT)).toHaveLength(1);
    expect(await engine.listConfigsForExtension('org-2', EXT)).toHaveLength(1);
  });

  it('setOverride() called twice for the same key updates the override in place, not creating a third entry', async () => {
    const { engine } = setup();
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 90 });
    const configs = await engine.listConfigsForExtension(ORG, EXT);
    expect(configs).toHaveLength(1);
    expect(configs[0]?.value).toBe(90);
  });

  it('setOverride() with a schema validates the payload the same way as setDefault()', async () => {
    const { engine } = setup();
    await expect(
      engine.setOverride(ORG, { extensionId: EXT, key: 'settings', value: { apiKey: 123 }, schema: [{ field: 'apiKey', type: 'string', required: true }] }),
    ).rejects.toBeInstanceOf(ConfigValidationError);
  });

  it('a config value can be a complex object', async () => {
    const { engine } = setup();
    const entry = await engine.setDefault(ORG, { extensionId: EXT, key: 'limits', value: { maxRequests: 100, windowSeconds: 60 } });
    expect(entry.value).toEqual({ maxRequests: 100, windowSeconds: 60 });
  });

  it('configuration entries for different keys under the same extension do not collide', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setDefault(ORG, { extensionId: EXT, key: 'retries', value: 3 });
    expect(await engine.listConfigsForExtension(ORG, EXT)).toHaveLength(2);
  });

  it('validateExtensionConfig with a required array field rejects a non-array value', () => {
    const result = validateExtensionConfig([{ field: 'tags', type: 'array', required: true }], { tags: 'not-an-array' });
    expect(result.valid).toBe(false);
  });

  it('validateExtensionConfig accumulates multiple errors', () => {
    const result = validateExtensionConfig(
      [
        { field: 'apiKey', type: 'string', required: true },
        { field: 'timeout', type: 'number', required: true },
      ],
      {},
    );
    expect(result.errors).toHaveLength(2);
  });

  it('getEffectiveConfig() is isolated per extension even for the same key', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: 'ext-a', key: 'timeout', value: 30 });
    await engine.setDefault(ORG, { extensionId: 'ext-b', key: 'timeout', value: 60 });
    expect((await engine.getEffectiveConfig(ORG, 'ext-a', 'timeout'))?.value).toBe(30);
    expect((await engine.getEffectiveConfig(ORG, 'ext-b', 'timeout'))?.value).toBe(60);
  });

  it('listConfigsForExtension() returns an empty array for an extension with no configuration', async () => {
    const { engine } = setup();
    expect(await engine.listConfigsForExtension(ORG, 'never-configured')).toEqual([]);
  });

  it('setDefault() and setOverride() both increment updatedAt independently of createdAt', async () => {
    let current = '2026-01-01T00:00:00.000Z';
    const engine = createExtensionConfigurationEngine(createExtensionConfigRepository(), undefined, () => current);
    const first = await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    current = '2026-01-02T00:00:00.000Z';
    const second = await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 45 });
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('getEffectiveConfig() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    expect(await engine.getEffectiveConfig('org-2', EXT, 'timeout')).toBeNull();
  });

  it('setOverride() with no prior default still creates a standalone override entry', async () => {
    const { engine } = setup();
    const entry = await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 90 });
    expect(entry.isOverride).toBe(true);
    expect((await engine.getEffectiveConfig(ORG, EXT, 'timeout'))?.value).toBe(90);
  });

  it('validateExtensionConfig with an object-typed field rejects an array value', () => {
    const result = validateExtensionConfig([{ field: 'meta', type: 'object', required: true }], { meta: [] });
    expect(result.valid).toBe(false);
  });

  it('validateExtensionConfig with an empty field list always validates', () => {
    expect(validateExtensionConfig([], { anything: 'goes' })).toEqual({ valid: true, errors: [] });
  });

  it('listConfigsForExtension() reflects both defaults and overrides for multiple keys', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: EXT, key: 'a', value: 1 });
    await engine.setDefault(ORG, { extensionId: EXT, key: 'b', value: 2 });
    await engine.setOverride(ORG, { extensionId: EXT, key: 'a', value: 10 });
    expect(await engine.listConfigsForExtension(ORG, EXT)).toHaveLength(3);
  });

  it('setDefault() with a schema and a valid boolean value succeeds', async () => {
    const { engine } = setup();
    const entry = await engine.setDefault(ORG, {
      extensionId: EXT,
      key: 'flags',
      value: { enabled: true },
      schema: [{ field: 'enabled', type: 'boolean', required: true }],
    });
    expect(entry.value).toEqual({ enabled: true });
  });

  it('getEffectiveConfig() for a key with only an override and no default still resolves correctly', async () => {
    const { engine } = setup();
    await engine.setOverride(ORG, { extensionId: EXT, key: 'onlyOverride', value: 'x' });
    expect((await engine.getEffectiveConfig(ORG, EXT, 'onlyOverride'))?.value).toBe('x');
  });

  it('removing the override conceptually (never overwritten) still leaves the default intact after multiple default updates', async () => {
    const { engine } = setup();
    await engine.setOverride(ORG, { extensionId: EXT, key: 'timeout', value: 60 });
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 30 });
    await engine.setDefault(ORG, { extensionId: EXT, key: 'timeout', value: 45 });
    expect((await engine.getEffectiveConfig(ORG, EXT, 'timeout'))?.value).toBe(60);
  });

  it('setDefault() and setOverride() for entirely different extensions never collide', async () => {
    const { engine } = setup();
    await engine.setDefault(ORG, { extensionId: 'ext-a', key: 'timeout', value: 10 });
    await engine.setOverride(ORG, { extensionId: 'ext-b', key: 'timeout', value: 20 });
    expect((await engine.getEffectiveConfig(ORG, 'ext-a', 'timeout'))?.value).toBe(10);
    expect((await engine.getEffectiveConfig(ORG, 'ext-b', 'timeout'))?.value).toBe(20);
  });
});
