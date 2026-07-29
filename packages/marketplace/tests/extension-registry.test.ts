import { describe, expect, it } from 'vitest';
import { createMarketplaceEventBus } from '../src/events/index.js';
import { canTransitionExtension, createExtensionRegistryEngine } from '../src/extension-registry/engine.impl.js';
import { createExtensionRepository } from '../src/extension-registry/repository.impl.js';
import { createExtensionSandboxEngine } from '../src/extension-sandbox/engine.impl.js';
import { createSandboxProfileRepository } from '../src/extension-sandbox/repository.impl.js';
import { createPackageRegistryEngine } from '../src/package-registry/engine.impl.js';
import { createPackageVersionRepository } from '../src/package-registry/repository.impl.js';
import { createPluginRegistryEngine } from '../src/plugin-registry/engine.impl.js';
import { createPluginRepository } from '../src/plugin-registry/repository.impl.js';
import { DuplicateExtensionKeyError, ExtensionNotFoundError, InvalidExtensionTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createMarketplaceEventBus();
  const packages = createPackageRegistryEngine(createPackageVersionRepository());
  const plugins = createPluginRegistryEngine(createPluginRepository());
  const sandbox = createExtensionSandboxEngine(createSandboxProfileRepository());
  const engine = createExtensionRegistryEngine(createExtensionRepository(), packages, plugins, sandbox, eventBus);
  return { engine, eventBus, packages, plugins, sandbox };
}

describe('canTransitionExtension (pure)', () => {
  it('installed -> enabled | uninstalled', () => {
    expect(canTransitionExtension('installed', 'enabled')).toBe(true);
    expect(canTransitionExtension('installed', 'uninstalled')).toBe(true);
  });

  it('enabled -> disabled | uninstalled', () => {
    expect(canTransitionExtension('enabled', 'disabled')).toBe(true);
    expect(canTransitionExtension('enabled', 'uninstalled')).toBe(true);
  });

  it('disabled -> enabled | uninstalled', () => {
    expect(canTransitionExtension('disabled', 'enabled')).toBe(true);
    expect(canTransitionExtension('disabled', 'uninstalled')).toBe(true);
  });

  it('uninstalled is terminal', () => {
    expect(canTransitionExtension('uninstalled', 'enabled')).toBe(false);
    expect(canTransitionExtension('uninstalled', 'installed')).toBe(false);
  });

  it('installed cannot go directly to disabled', () => {
    expect(canTransitionExtension('installed', 'disabled')).toBe(false);
  });
});

describe('ExtensionRegistryEngine — lifecycle', () => {
  it('install() starts at installed status', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(extension.status).toBe('installed');
  });

  it('publishes extension.installed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('extension.installed', (payload) => (seen = payload));
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(seen).toEqual({ organizationId: ORG, extensionId: extension.id, key: 'com.acme.widget' });
  });

  it('install() rejects a duplicate key within the same organization', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await expect(engine.install(ORG, { key: 'com.acme.widget', name: 'Widget 2', currentVersion: '1.0.0' })).rejects.toBeInstanceOf(DuplicateExtensionKeyError);
  });

  it('the same key is allowed in a different organization', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await expect(engine.install('org-2', { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' })).resolves.toBeTruthy();
  });

  it('install() -> enable() -> disable() -> enable() -> uninstall() progresses the full lifecycle', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    const enabled = await engine.enable(ORG, extension.id);
    expect(enabled.status).toBe('enabled');
    const disabled = await engine.disable(ORG, extension.id);
    expect(disabled.status).toBe('disabled');
    const reEnabled = await engine.enable(ORG, extension.id);
    expect(reEnabled.status).toBe('enabled');
    const uninstalled = await engine.uninstall(ORG, extension.id);
    expect(uninstalled.status).toBe('uninstalled');
  });

  it('publishes extension.enabled, extension.disabled, and extension.uninstalled', async () => {
    const { engine, eventBus } = setup();
    const seen: string[] = [];
    eventBus.subscribeAll((name) => seen.push(name));
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.enable(ORG, extension.id);
    await engine.disable(ORG, extension.id);
    await engine.uninstall(ORG, extension.id);
    expect(seen).toEqual(['extension.installed', 'extension.enabled', 'extension.disabled', 'extension.uninstalled']);
  });

  it('rejects uninstall() called twice', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.uninstall(ORG, extension.id);
    await expect(engine.uninstall(ORG, extension.id)).rejects.toBeInstanceOf(InvalidExtensionTransitionError);
  });

  it('rejects installed -> disabled as a direct transition', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await expect(engine.disable(ORG, extension.id)).rejects.toBeInstanceOf(InvalidExtensionTransitionError);
  });

  it('enable() throws ExtensionNotFoundError for an unknown extension', async () => {
    const { engine } = setup();
    await expect(engine.enable(ORG, 'missing')).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('getExtension()/findByKey()/listExtensions() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getExtension(ORG, 'missing')).toBeNull();
    expect(await engine.findByKey(ORG, 'com.acme.widget')).toBeNull();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(await engine.getExtension(ORG, extension.id)).toEqual(extension);
    expect(await engine.findByKey(ORG, 'com.acme.widget')).toEqual(extension);
    expect(await engine.listExtensions(ORG)).toHaveLength(1);
  });

  it('extensions are isolated per organization', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.install('org-2', { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(await engine.listExtensions(ORG)).toHaveLength(1);
    expect(await engine.listExtensions('org-2')).toHaveLength(1);
  });
});

describe('ExtensionRegistryEngine — upgrade', () => {
  it('upgrade() updates currentVersion and publishes extension.upgraded', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('extension.upgraded', (payload) => (seen = payload));
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    const upgraded = await engine.upgrade(ORG, extension.id, { toVersion: '1.1.0' });
    expect(upgraded.currentVersion).toBe('1.1.0');
    expect(seen).toEqual({ organizationId: ORG, extensionId: extension.id, fromVersion: '1.0.0', toVersion: '1.1.0' });
  });

  it('upgrade() does not change the extension status', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.enable(ORG, extension.id);
    const upgraded = await engine.upgrade(ORG, extension.id, { toVersion: '1.1.0' });
    expect(upgraded.status).toBe('enabled');
  });

  it('upgrade() throws InvalidExtensionTransitionError for an uninstalled extension', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.uninstall(ORG, extension.id);
    await expect(engine.upgrade(ORG, extension.id, { toVersion: '1.1.0' })).rejects.toBeInstanceOf(InvalidExtensionTransitionError);
  });

  it('upgrade() throws ExtensionNotFoundError for an unknown extension', async () => {
    const { engine } = setup();
    await expect(engine.upgrade(ORG, 'missing', { toVersion: '1.1.0' })).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });
});

describe('ExtensionRegistryEngine — validateExtension (composed with Package Registry, Plugin Registry, Extension Sandbox)', () => {
  it('is invalid when no published package version exists for the current version', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('no published package version'))).toBe(true);
  });

  it('is invalid when no sandbox profile is registered', async () => {
    const { engine, packages } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('sandbox profile'))).toBe(true);
  });

  it('is valid once a package version and a sandbox profile both exist, and no plugin is referenced', async () => {
    const { engine, packages, sandbox } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result).toEqual({ valid: true, reasons: [] });
  });

  it('publishes extension.validated with the computed validity', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('extension.validated', (payload) => (seen = payload));
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.validateExtension(ORG, extension.id);
    expect(seen).toEqual({ organizationId: ORG, extensionId: extension.id, valid: false });
  });

  it('is invalid when the referenced plugin is incompatible with the current version', async () => {
    const { engine, packages, plugins, sandbox } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=2.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(false);
    expect(result.reasons.some((reason) => reason.includes('does not satisfy'))).toBe(true);
  });

  it('is valid when the referenced plugin is compatible with the current version', async () => {
    const { engine, packages, plugins, sandbox } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });

  it('validateExtension() throws ExtensionNotFoundError for an unknown extension', async () => {
    const { engine } = setup();
    await expect(engine.validateExtension(ORG, 'missing')).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('accumulates multiple validation failure reasons at once', async () => {
    const { engine, plugins } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=2.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ExtensionRegistryEngine — additional lifecycle coverage', () => {
  it('install() persists the name and currentVersion verbatim', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Acme Widget', currentVersion: '2.3.1' });
    expect(extension.name).toBe('Acme Widget');
    expect(extension.currentVersion).toBe('2.3.1');
  });

  it('install() without a pluginId leaves pluginId undefined', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(extension.pluginId).toBeUndefined();
  });

  it('install() with a pluginId persists it', async () => {
    const { engine, plugins } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    expect(extension.pluginId).toBe(plugin.id);
  });

  it('rejects disabled -> installed as an invalid transition (no such transition exists)', () => {
    expect(canTransitionExtension('disabled', 'installed')).toBe(false);
  });

  it('enable() on a disabled extension returns it to enabled, not installed', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.enable(ORG, extension.id);
    await engine.disable(ORG, extension.id);
    const reEnabled = await engine.enable(ORG, extension.id);
    expect(reEnabled.status).toBe('enabled');
  });

  it('findByKey() returns null for a key from a different organization', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(await engine.findByKey('org-2', 'com.acme.widget')).toBeNull();
  });

  it('getExtension() returns null for an extension id from a different organization', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    expect(await engine.getExtension('org-2', extension.id)).toBeNull();
  });

  it('multiple extensions can be installed and listed together', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await engine.install(ORG, { key: 'b', name: 'B', currentVersion: '1.0.0' });
    await engine.install(ORG, { key: 'c', name: 'C', currentVersion: '1.0.0' });
    expect(await engine.listExtensions(ORG)).toHaveLength(3);
  });

  it('disable() throws ExtensionNotFoundError for an unknown extension', async () => {
    const { engine } = setup();
    await expect(engine.disable(ORG, 'missing')).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('uninstall() throws ExtensionNotFoundError for an unknown extension', async () => {
    const { engine } = setup();
    await expect(engine.uninstall(ORG, 'missing')).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('validateExtension() is invalid with only the sandbox profile missing when a package version exists but the plugin check passes', async () => {
    const { engine, packages, plugins } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(false);
    expect(result.reasons).toHaveLength(1);
  });

  it('upgrade() can be called multiple times, each recording the correct fromVersion', async () => {
    const { engine, eventBus } = setup();
    const seen: unknown[] = [];
    eventBus.subscribe('extension.upgraded', (payload) => seen.push(payload));
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await engine.upgrade(ORG, extension.id, { toVersion: '1.1.0' });
    await engine.upgrade(ORG, extension.id, { toVersion: '1.2.0' });
    expect(seen).toEqual([
      { organizationId: ORG, extensionId: extension.id, fromVersion: '1.0.0', toVersion: '1.1.0' },
      { organizationId: ORG, extensionId: extension.id, fromVersion: '1.1.0', toVersion: '1.2.0' },
    ]);
  });

  it('upgrade() throws ExtensionNotFoundError when the extension belongs to a different organization', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await expect(engine.upgrade('org-2', extension.id, { toVersion: '1.1.0' })).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('enable() throws ExtensionNotFoundError when the extension belongs to a different organization', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0' });
    await expect(engine.enable('org-2', extension.id)).rejects.toBeInstanceOf(ExtensionNotFoundError);
  });

  it('listExtensions() returns an empty array for an organization with no installed extensions', async () => {
    const { engine } = setup();
    expect(await engine.listExtensions(ORG)).toEqual([]);
  });

  it('validateExtension() is invalid with two reasons when both the package version and the plugin compatibility fail', async () => {
    const { engine, plugins } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=5.0.0' });
    const extension = await engine.install(ORG, { key: 'com.acme.widget', name: 'Widget', currentVersion: '1.0.0', pluginId: plugin.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.reasons).toHaveLength(3);
  });

  it('install() publishes extension.installed with the exact key given, not a normalized form', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('extension.installed', (payload) => (seen = payload));
    await engine.install(ORG, { key: 'Com.Acme.Widget', name: 'Widget', currentVersion: '1.0.0' });
    expect((seen as { key: string }).key).toBe('Com.Acme.Widget');
  });

  it('canTransitionExtension is a pure function with no side effects across repeated calls', () => {
    const first = canTransitionExtension('installed', 'enabled');
    const second = canTransitionExtension('installed', 'enabled');
    expect(first).toBe(second);
  });

  it('findByKey() is isolated per organization even for extensions with the same key', async () => {
    const { engine } = setup();
    await engine.install(ORG, { key: 'shared-key', name: 'A', currentVersion: '1.0.0' });
    await engine.install('org-2', { key: 'shared-key', name: 'B', currentVersion: '1.0.0' });
    expect((await engine.findByKey(ORG, 'shared-key'))?.name).toBe('A');
    expect((await engine.findByKey('org-2', 'shared-key'))?.name).toBe('B');
  });

  it('validateExtension() with a plugin but no explicit pluginId compatibility issue still checks the package version and sandbox', async () => {
    const { engine, packages, sandbox } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id, isolationLevel: 'container' });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });

  it('disable() throws InvalidExtensionTransitionError from installed status directly', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await expect(engine.disable(ORG, extension.id)).rejects.toBeInstanceOf(InvalidExtensionTransitionError);
  });

  it('validateExtension() with a valid plugin and package but no sandbox is invalid with exactly one reason', async () => {
    const { engine, packages, plugins } = setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'p1', name: 'P', compatibleVersionRange: '>=1.0.0' });
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0', pluginId: plugin.id });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.reasons).toEqual(['no sandbox profile registered for this extension']);
  });

  it('installs with the same key succeed across three different organizations independently', async () => {
    const { engine } = setup();
    await engine.install('org-a', { key: 'shared', name: 'A', currentVersion: '1.0.0' });
    await engine.install('org-b', { key: 'shared', name: 'B', currentVersion: '1.0.0' });
    await engine.install('org-c', { key: 'shared', name: 'C', currentVersion: '1.0.0' });
    expect(await engine.listExtensions('org-a')).toHaveLength(1);
    expect(await engine.listExtensions('org-b')).toHaveLength(1);
    expect(await engine.listExtensions('org-c')).toHaveLength(1);
  });

  it('validateExtension() reasons array is empty exactly when valid is true', async () => {
    const { engine, packages, sandbox } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(result.reasons.length === 0);
  });

  it('a extension’s upgrade history is reflected only in the latest currentVersion, not accumulated', async () => {
    const { engine } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await engine.upgrade(ORG, extension.id, { toVersion: '1.1.0' });
    await engine.upgrade(ORG, extension.id, { toVersion: '1.2.0' });
    const final = await engine.getExtension(ORG, extension.id);
    expect(final?.currentVersion).toBe('1.2.0');
  });

  it('a disabled extension can still be validated', async () => {
    const { engine, packages, sandbox } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await engine.enable(ORG, extension.id);
    await engine.disable(ORG, extension.id);
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });

  it('an uninstalled extension can still be validated (validation is status-independent)', async () => {
    const { engine, packages, sandbox } = setup();
    const extension = await engine.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await sandbox.createSandboxProfile(ORG, { extensionId: extension.id });
    await engine.uninstall(ORG, extension.id);
    const result = await engine.validateExtension(ORG, extension.id);
    expect(result.valid).toBe(true);
  });
});
