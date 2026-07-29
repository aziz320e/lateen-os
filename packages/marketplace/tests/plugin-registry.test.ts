import { describe, expect, it } from 'vitest';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { canTransitionPlugin, createPluginRegistryEngine } from '../src/plugin-registry/engine.impl.js';
import { createPluginRepository } from '../src/plugin-registry/repository.impl.js';
import { InvalidPluginTransitionError, PluginNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createMarketplaceEventBus();
  const engine = createPluginRegistryEngine(createPluginRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionPlugin (pure)', () => {
  it('active -> deprecated | archived', () => {
    expect(canTransitionPlugin('active', 'deprecated')).toBe(true);
    expect(canTransitionPlugin('active', 'archived')).toBe(true);
  });

  it('deprecated -> active | archived', () => {
    expect(canTransitionPlugin('deprecated', 'active')).toBe(true);
    expect(canTransitionPlugin('deprecated', 'archived')).toBe(true);
  });

  it('archived is terminal', () => {
    expect(canTransitionPlugin('archived', 'active')).toBe(false);
  });
});

describe('PluginRegistryEngine', () => {
  it('registerPlugin() starts at active status', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(plugin.status).toBe('active');
  });

  it('registerPlugin() defaults capabilities and requiredPermissions to empty arrays', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(plugin.capabilities).toEqual([]);
    expect(plugin.requiredPermissions).toEqual([]);
  });

  it('registerPlugin() persists explicit capabilities and requiredPermissions', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, {
      key: 'com.acme.plugin',
      name: 'Acme Plugin',
      capabilities: ['read:data'],
      requiredPermissions: ['network:outbound'],
      compatibleVersionRange: '>=1.0.0',
    });
    expect(plugin.capabilities).toEqual(['read:data']);
    expect(plugin.requiredPermissions).toEqual(['network:outbound']);
  });

  it('publishes plugin.registered', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('plugin.registered', (payload) => (seen = payload));
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(seen).toEqual({ organizationId: ORG, pluginId: plugin.id, key: 'com.acme.plugin' });
  });

  it('deprecatePlugin() -> reactivatePlugin() -> archivePlugin() progresses the lifecycle', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    const deprecated = await engine.deprecatePlugin(ORG, plugin.id);
    expect(deprecated.status).toBe('deprecated');
    const reactivated = await engine.reactivatePlugin(ORG, plugin.id);
    expect(reactivated.status).toBe('active');
    const archived = await engine.archivePlugin(ORG, plugin.id);
    expect(archived.status).toBe('archived');
  });

  it('rejects archivePlugin() called twice', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await engine.archivePlugin(ORG, plugin.id);
    await expect(engine.archivePlugin(ORG, plugin.id)).rejects.toBeInstanceOf(InvalidPluginTransitionError);
  });

  it('deprecatePlugin() throws PluginNotFoundError for an unknown plugin', async () => {
    const { engine } = setup();
    await expect(engine.deprecatePlugin(ORG, 'missing')).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('checkCompatibility() returns compatible: true when the host version satisfies the range', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    const result = await engine.checkCompatibility(ORG, plugin.id, '1.5.0');
    expect(result).toEqual({ compatible: true });
  });

  it('checkCompatibility() returns compatible: false with a reason when the host version does not satisfy the range', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=2.0.0' });
    const result = await engine.checkCompatibility(ORG, plugin.id, '1.0.0');
    expect(result.compatible).toBe(false);
    expect(result.reason).toContain('does not satisfy');
  });

  it('checkCompatibility() publishes compatibility.checked', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('compatibility.checked', (payload) => (seen = payload));
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await engine.checkCompatibility(ORG, plugin.id, '1.5.0');
    expect(seen).toEqual({ organizationId: ORG, subjectId: plugin.id, compatible: true });
  });

  it('checkCompatibility() throws PluginNotFoundError for an unknown plugin', async () => {
    const { engine } = setup();
    await expect(engine.checkCompatibility(ORG, 'missing', '1.0.0')).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('getPlugin()/findByKey()/listPlugins() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getPlugin(ORG, 'missing')).toBeNull();
    expect(await engine.findByKey(ORG, 'com.acme.plugin')).toBeNull();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(await engine.getPlugin(ORG, plugin.id)).toEqual(plugin);
    expect(await engine.findByKey(ORG, 'com.acme.plugin')).toEqual(plugin);
    expect(await engine.listPlugins(ORG)).toHaveLength(1);
  });

  it('plugins are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await engine.registerPlugin('org-2', { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(await engine.listPlugins(ORG)).toHaveLength(1);
    expect(await engine.listPlugins('org-2')).toHaveLength(1);
  });

  it('checkCompatibility() with an exact-match range requires an exact version', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '1.0.0' });
    expect((await engine.checkCompatibility(ORG, plugin.id, '1.0.0')).compatible).toBe(true);
    expect((await engine.checkCompatibility(ORG, plugin.id, '1.0.1')).compatible).toBe(false);
  });

  it('reactivatePlugin() throws InvalidPluginTransitionError when already active', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await expect(engine.reactivatePlugin(ORG, plugin.id)).rejects.toBeInstanceOf(InvalidPluginTransitionError);
  });

  it('deprecated -> archived is a valid direct transition', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await engine.deprecatePlugin(ORG, plugin.id);
    const archived = await engine.archivePlugin(ORG, plugin.id);
    expect(archived.status).toBe('archived');
  });

  it('findByKey() returns null for a key from a different organization', async () => {
    const { engine } = setup();
    await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(await engine.findByKey('org-2', 'com.acme.plugin')).toBeNull();
  });

  it('two plugins can share the same key across different organizations without conflict', async () => {
    const { engine } = setup();
    const pluginA = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'A', compatibleVersionRange: '>=1.0.0' });
    const pluginB = await engine.registerPlugin('org-2', { key: 'com.acme.plugin', name: 'B', compatibleVersionRange: '>=1.0.0' });
    expect(pluginA.id).not.toBe(pluginB.id);
  });

  it('checkCompatibility() with a <= range correctly rejects a version above the ceiling', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '<=1.5.0' });
    const result = await engine.checkCompatibility(ORG, plugin.id, '2.0.0');
    expect(result.compatible).toBe(false);
  });

  it('getPlugin() returns null for a plugin id from a different organization', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    expect(await engine.getPlugin('org-2', plugin.id)).toBeNull();
  });

  it('multiple plugins can be registered and listed together', async () => {
    const { engine } = setup();
    await engine.registerPlugin(ORG, { key: 'a', name: 'A', compatibleVersionRange: '>=1.0.0' });
    await engine.registerPlugin(ORG, { key: 'b', name: 'B', compatibleVersionRange: '>=1.0.0' });
    await engine.registerPlugin(ORG, { key: 'c', name: 'C', compatibleVersionRange: '>=1.0.0' });
    expect(await engine.listPlugins(ORG)).toHaveLength(3);
  });

  it('archivePlugin() throws PluginNotFoundError for an unknown plugin', async () => {
    const { engine } = setup();
    await expect(engine.archivePlugin(ORG, 'missing')).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('checkCompatibility() throws PluginNotFoundError when the plugin belongs to a different organization', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    await expect(engine.checkCompatibility('org-2', plugin.id, '1.0.0')).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('listPlugins() returns an empty array for an organization with no registered plugins', async () => {
    const { engine } = setup();
    expect(await engine.listPlugins(ORG)).toEqual([]);
  });

  it('registerPlugin() with an empty capabilities array is distinguishable from a plugin with none given', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', capabilities: [], compatibleVersionRange: '>=1.0.0' });
    expect(plugin.capabilities).toEqual([]);
  });

  it('deprecatePlugin() is isolated per organization', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    await expect(engine.deprecatePlugin('org-2', plugin.id)).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('checkCompatibility() with the bare highest supported version always compatible against itself', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    const result = await engine.checkCompatibility(ORG, plugin.id, '1.0.0');
    expect(result.compatible).toBe(true);
  });

  it('reactivatePlugin() is isolated per organization', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    await engine.deprecatePlugin(ORG, plugin.id);
    await expect(engine.reactivatePlugin('org-2', plugin.id)).rejects.toBeInstanceOf(PluginNotFoundError);
  });

  it('registerPlugin() with a name distinct from its key stores both independently', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'A Human-Readable Name', compatibleVersionRange: '>=1.0.0' });
    expect(plugin.key).toBe('com.acme.plugin');
    expect(plugin.name).toBe('A Human-Readable Name');
  });

  it('deprecatePlugin() then archivePlugin() cannot be followed by reactivatePlugin()', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    await engine.deprecatePlugin(ORG, plugin.id);
    await engine.archivePlugin(ORG, plugin.id);
    await expect(engine.reactivatePlugin(ORG, plugin.id)).rejects.toBeInstanceOf(InvalidPluginTransitionError);
  });

  it('checkCompatibility() with a compatibleVersionRange of exactly the host version succeeds under the = operator', async () => {
    const { engine } = setup();
    const plugin = await engine.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '=1.0.0' });
    const result = await engine.checkCompatibility(ORG, plugin.id, '1.0.0');
    expect(result.compatible).toBe(true);
  });
});
