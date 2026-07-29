import { describe, expect, it } from 'vitest';
import { createExtensionSandboxEngine } from '../src/extension-sandbox/engine.impl.js';
import { createSandboxProfileRepository } from '../src/extension-sandbox/repository.impl.js';
import { createExtensionConfigRepository } from '../src/extension-configuration/repository.impl.js';
import { createExtensionRegistryEngine } from '../src/extension-registry/engine.impl.js';
import { createExtensionRepository } from '../src/extension-registry/repository.impl.js';
import { createCatalogEntryRepository } from '../src/marketplace-catalog/repository.impl.js';
import { createMarketplaceCatalogEngine } from '../src/marketplace-catalog/engine.impl.js';
import { createPackageRegistryEngine } from '../src/package-registry/engine.impl.js';
import { createPackageVersionRepository } from '../src/package-registry/repository.impl.js';
import { createPluginRegistryEngine } from '../src/plugin-registry/engine.impl.js';
import { createPluginRepository } from '../src/plugin-registry/repository.impl.js';
import { createMarketplaceQueries } from '../src/queries/marketplace-queries.impl.js';

const ORG = 'org-1';

async function setup() {
  const extensionRepository = createExtensionRepository();
  const pluginRepository = createPluginRepository();
  const packageVersionRepository = createPackageVersionRepository();
  const catalogEntryRepository = createCatalogEntryRepository();
  const extensionConfigRepository = createExtensionConfigRepository();
  const sandboxProfileRepository = createSandboxProfileRepository();

  const packages = createPackageRegistryEngine(packageVersionRepository);
  const plugins = createPluginRegistryEngine(pluginRepository);
  const sandbox = createExtensionSandboxEngine(sandboxProfileRepository);
  const extensions = createExtensionRegistryEngine(extensionRepository, packages, plugins, sandbox);
  const catalog = createMarketplaceCatalogEngine(catalogEntryRepository);

  const queries = createMarketplaceQueries({
    extensionRepository,
    pluginRepository,
    packageVersionRepository,
    catalogEntryRepository,
    extensionConfigRepository,
  });

  return { extensions, plugins, packages, catalog, queries, extensionConfigRepository };
}

describe('MarketplaceQueries', () => {
  it('findExtensions() filters by status and paginates', async () => {
    const { extensions, queries } = await setup();
    const extA = await extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await extensions.install(ORG, { key: 'b', name: 'B', currentVersion: '1.0.0' });
    await extensions.enable(ORG, extA.id);

    const enabled = await queries.findExtensions({ organizationId: ORG, status: 'enabled' });
    expect(enabled.total).toBe(1);

    const all = await queries.findExtensions({ organizationId: ORG, limit: 1 });
    expect(all.extensions).toHaveLength(1);
    expect(all.total).toBe(2);
  });

  it('findPlugins() filters by status', async () => {
    const { plugins, queries } = await setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'p1', name: 'Plugin One', compatibleVersionRange: '>=1.0.0' });
    await plugins.deprecatePlugin(ORG, plugin.id);
    expect((await queries.findPlugins({ organizationId: ORG, status: 'deprecated' })).total).toBe(1);
    expect((await queries.findPlugins({ organizationId: ORG, status: 'active' })).total).toBe(0);
  });

  it('findPackages() filters by extensionKey', async () => {
    const { packages, queries } = await setup();
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'com.acme.other', version: '1.0.0' });
    expect((await queries.findPackages({ organizationId: ORG, extensionKey: 'com.acme.widget' })).total).toBe(1);
    expect((await queries.findPackages({ organizationId: ORG })).total).toBe(2);
  });

  it('findCatalog() filters by category and publisher', async () => {
    const { catalog, queries } = await setup();
    await catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'b', name: 'B', category: 'analytics', publisher: 'Other' });
    expect((await queries.findCatalog({ organizationId: ORG, category: 'productivity' })).total).toBe(1);
    expect((await queries.findCatalog({ organizationId: ORG, publisher: 'Other' })).total).toBe(1);
  });

  it('findConfigurations() filters by extensionId when given, otherwise returns all', async () => {
    const { extensionConfigRepository, queries } = await setup();
    await extensionConfigRepository.save({
      id: 'config-1',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extensionId: 'ext-a',
      key: 'timeout',
      value: 30,
      isOverride: false,
    } as never);
    await extensionConfigRepository.save({
      id: 'config-2',
      organizationId: ORG,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extensionId: 'ext-b',
      key: 'timeout',
      value: 60,
      isOverride: false,
    } as never);
    expect((await queries.findConfigurations({ organizationId: ORG, extensionId: 'ext-a' })).total).toBe(1);
    expect((await queries.findConfigurations({ organizationId: ORG })).total).toBe(2);
  });

  it('findCompatibility() reports each plugin’s compatibility range', async () => {
    const { plugins, queries } = await setup();
    const plugin = await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Plugin', compatibleVersionRange: '>=1.0.0' });
    const result = await queries.findCompatibility({ organizationId: ORG });
    expect(result.compatibility).toEqual([{ pluginId: plugin.id, key: 'com.acme.plugin', compatibleVersionRange: '>=1.0.0' }]);
  });

  it('findCompatibility() filters by pluginId', async () => {
    const { plugins, queries } = await setup();
    const pluginA = await plugins.registerPlugin(ORG, { key: 'a', name: 'A', compatibleVersionRange: '>=1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'b', name: 'B', compatibleVersionRange: '>=2.0.0' });
    const result = await queries.findCompatibility({ organizationId: ORG, pluginId: pluginA.id });
    expect(result.total).toBe(1);
  });

  it('searchMarketplace() finds extensions, plugins, and catalog entries by keyword', async () => {
    const { extensions, plugins, catalog, queries } = await setup();
    await extensions.install(ORG, { key: 'com.acme.widget', name: 'Acme Widget', currentVersion: '1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'com.acme.plugin', name: 'Acme Plugin', compatibleVersionRange: '>=1.0.0' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'com.acme.other', name: 'Acme Catalog Entry', category: 'productivity', publisher: 'Acme' });

    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'acme' });
    expect(result.total).toBe(3);
    const recordTypes = result.matches.map((match) => match.recordType).sort();
    expect(recordTypes).toEqual(['catalog', 'extension', 'plugin']);
  });

  it('searchMarketplace() returns no matches for an unrelated keyword', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'com.acme.widget', name: 'Acme Widget', currentVersion: '1.0.0' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'zzz-no-match' });
    expect(result.matches).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('searchMarketplace() respects an explicit limit', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'acme-one', name: 'Acme One', currentVersion: '1.0.0' });
    await extensions.install(ORG, { key: 'acme-two', name: 'Acme Two', currentVersion: '1.0.0' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'acme', limit: 1 });
    expect(result.matches).toHaveLength(1);
  });

  it('searchMarketplace() ranks an exact match above a substring match', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'acme', name: 'acme', currentVersion: '1.0.0' });
    await extensions.install(ORG, { key: 'acme-extended', name: 'acme-extended', currentVersion: '1.0.0' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'acme' });
    expect(result.matches[0]?.score).toBe(3);
  });

  it('findExtensions() returns an empty result set when nothing has been installed', async () => {
    const { queries } = await setup();
    expect(await queries.findExtensions({ organizationId: ORG })).toEqual({ extensions: [], total: 0 });
  });

  it('findExtensions() with an offset skips the requested number of results', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await extensions.install(ORG, { key: 'b', name: 'B', currentVersion: '1.0.0' });
    const result = await queries.findExtensions({ organizationId: ORG, offset: 1 });
    expect(result.extensions).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('findCompatibility() returns an empty result set when no plugins are registered', async () => {
    const { queries } = await setup();
    expect(await queries.findCompatibility({ organizationId: ORG })).toEqual({ compatibility: [], total: 0 });
  });

  it('findPackages() returns an empty result set when nothing has been published', async () => {
    const { queries } = await setup();
    expect(await queries.findPackages({ organizationId: ORG })).toEqual({ packages: [], total: 0 });
  });

  it('searchMarketplace() finds a plugin by its key even when the name does not match', async () => {
    const { plugins, queries } = await setup();
    await plugins.registerPlugin(ORG, { key: 'zephyr-plugin', name: 'Something Else', compatibleVersionRange: '>=1.0.0' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'zephyr' });
    expect(result.matches.some((match) => match.recordType === 'plugin')).toBe(true);
  });

  it('every find* method is isolated per organization', async () => {
    const { extensions, plugins, packages, catalog, queries } = await setup();
    await extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'p', name: 'P', compatibleVersionRange: '>=1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });

    expect((await queries.findExtensions({ organizationId: 'org-2' })).total).toBe(0);
    expect((await queries.findPlugins({ organizationId: 'org-2' })).total).toBe(0);
    expect((await queries.findPackages({ organizationId: 'org-2' })).total).toBe(0);
    expect((await queries.findCatalog({ organizationId: 'org-2' })).total).toBe(0);
  });

  it('findPlugins() returns an empty result set when nothing has been registered', async () => {
    const { queries } = await setup();
    expect(await queries.findPlugins({ organizationId: ORG })).toEqual({ plugins: [], total: 0 });
  });

  it('findCatalog() with no filters returns every catalog entry', async () => {
    const { catalog, queries } = await setup();
    await catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'productivity', publisher: 'Acme' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'b', name: 'B', category: 'analytics', publisher: 'Other' });
    expect((await queries.findCatalog({ organizationId: ORG })).total).toBe(2);
  });

  it('searchMarketplace() finds a catalog entry by its exact name', async () => {
    const { catalog, queries } = await setup();
    await catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'exactmatch', category: 'productivity', publisher: 'Acme' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'exactmatch' });
    expect(result.matches[0]?.score).toBe(3);
  });

  it('findConfigurations() returns an empty result set for an organization with no configuration entries', async () => {
    const { queries } = await setup();
    expect(await queries.findConfigurations({ organizationId: ORG })).toEqual({ configurations: [], total: 0 });
  });

  it('findCompatibility() with a limit returns a bounded page while total reflects the full match count', async () => {
    const { plugins, queries } = await setup();
    await plugins.registerPlugin(ORG, { key: 'a', name: 'A', compatibleVersionRange: '>=1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'b', name: 'B', compatibleVersionRange: '>=1.0.0' });
    const page = await queries.findCompatibility({ organizationId: ORG, limit: 1 });
    expect(page.compatibility).toHaveLength(1);
    expect(page.total).toBe(2);
  });

  it('findExtensions() with no filter returns every extension for the organization', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    await extensions.install(ORG, { key: 'b', name: 'B', currentVersion: '1.0.0' });
    expect((await queries.findExtensions({ organizationId: ORG })).total).toBe(2);
  });

  it('findPackages() with an offset skips the requested number of results', async () => {
    const { packages, queries } = await setup();
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    await packages.publishVersion(ORG, { extensionKey: 'a', version: '2.0.0' });
    const result = await queries.findPackages({ organizationId: ORG, extensionKey: 'a', offset: 1 });
    expect(result.packages).toHaveLength(1);
  });

  it('findExtensions() with a status filter that matches nothing returns an empty result set', async () => {
    const { extensions, queries } = await setup();
    await extensions.install(ORG, { key: 'a', name: 'A', currentVersion: '1.0.0' });
    expect((await queries.findExtensions({ organizationId: ORG, status: 'uninstalled' })).total).toBe(0);
  });

  it('searchMarketplace() combines matches from all three record types into one sorted list', async () => {
    const { extensions, plugins, catalog, queries } = await setup();
    await extensions.install(ORG, { key: 'zzz', name: 'zzz', currentVersion: '1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'zzz-plugin', name: 'zzz', compatibleVersionRange: '>=1.0.0' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'zzz-cat', name: 'zzz', category: 'x', publisher: 'y' });
    const result = await queries.searchMarketplace({ organizationId: ORG, keyword: 'zzz' });
    expect(result.total).toBe(3);
  });

  it('findCatalog() with an offset paginates correctly', async () => {
    const { catalog, queries } = await setup();
    await catalog.publishToCatalog(ORG, { extensionKey: 'a', name: 'A', category: 'x', publisher: 'y' });
    await catalog.publishToCatalog(ORG, { extensionKey: 'b', name: 'B', category: 'x', publisher: 'y' });
    const page = await queries.findCatalog({ organizationId: ORG, offset: 1 });
    expect(page.entries).toHaveLength(1);
    expect(page.total).toBe(2);
  });

  it('findPlugins() with an offset paginates correctly', async () => {
    const { plugins, queries } = await setup();
    await plugins.registerPlugin(ORG, { key: 'a', name: 'A', compatibleVersionRange: '>=1.0.0' });
    await plugins.registerPlugin(ORG, { key: 'b', name: 'B', compatibleVersionRange: '>=1.0.0' });
    const page = await queries.findPlugins({ organizationId: ORG, offset: 1 });
    expect(page.plugins).toHaveLength(1);
    expect(page.total).toBe(2);
  });
});
