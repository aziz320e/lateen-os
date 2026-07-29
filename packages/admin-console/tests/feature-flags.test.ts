import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { createFeatureFlagEngine } from '../src/feature-flags/engine.impl.js';
import { createFeatureFlagRepository } from '../src/feature-flags/repository.impl.js';
import { FeatureFlagNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createFeatureFlagEngine(createFeatureFlagRepository(), eventBus);
  return { engine, eventBus };
}

describe('FeatureFlagEngine', () => {
  it('registerFlag() defaults enabled to false', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui' });
    expect(flag.enabled).toBe(false);
  });

  it('registerFlag() accepts an explicit enabled: true', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', enabled: true });
    expect(flag.enabled).toBe(true);
  });

  it('enableFlag() / disableFlag() toggle status and publish events', async () => {
    const { engine, eventBus } = setup();
    let enabledSeen: unknown;
    let disabledSeen: unknown;
    eventBus.subscribe('feature.enabled', (payload) => (enabledSeen = payload));
    eventBus.subscribe('feature.disabled', (payload) => (disabledSeen = payload));

    const flag = await engine.registerFlag(ORG, { key: 'new-ui' });
    const enabled = await engine.enableFlag(ORG, flag.id);
    expect(enabled.enabled).toBe(true);
    expect(enabledSeen).toEqual({ organizationId: ORG, featureFlagId: flag.id, key: 'new-ui' });

    const disabled = await engine.disableFlag(ORG, flag.id);
    expect(disabled.enabled).toBe(false);
    expect(disabledSeen).toEqual({ organizationId: ORG, featureFlagId: flag.id, key: 'new-ui' });
  });

  it('enableFlag() throws FeatureFlagNotFoundError for an unknown flag', async () => {
    const { engine } = setup();
    await expect(engine.enableFlag(ORG, 'missing')).rejects.toBeInstanceOf(FeatureFlagNotFoundError);
  });

  it('isEnabled() falls back to false when no flag is registered for that key', async () => {
    const { engine } = setup();
    expect(await engine.isEnabled(ORG, 'unknown-key')).toBe(false);
  });

  it('isEnabled() resolves the organization-wide default when no context is given', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui' });
    await engine.enableFlag(ORG, flag.id);
    expect(await engine.isEnabled(ORG, 'new-ui')).toBe(true);
  });

  it('isEnabled() prefers a tenant-scoped override over the organization-wide default', async () => {
    const { engine } = setup();
    await engine.registerFlag(ORG, { key: 'new-ui', enabled: false });
    const tenantFlag = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', enabled: true });
    await engine.enableFlag(ORG, tenantFlag.id);
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-1' })).toBe(true);
    expect(await engine.isEnabled(ORG, 'new-ui')).toBe(false);
  });

  it('isEnabled() prefers an environment-scoped override over a tenant-scoped one', async () => {
    const { engine } = setup();
    await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', enabled: true });
    await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', environmentId: 'env-1', enabled: false });
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-1', environmentId: 'env-1' })).toBe(false);
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-1' })).toBe(true);
  });

  it('getFlag()/listFlags() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getFlag(ORG, 'missing')).toBeNull();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui' });
    expect(await engine.getFlag(ORG, flag.id)).toEqual(flag);
    expect(await engine.listFlags(ORG)).toHaveLength(1);
  });

  it('flags are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerFlag(ORG, { key: 'new-ui' });
    await engine.registerFlag('org-2', { key: 'new-ui' });
    expect(await engine.listFlags(ORG)).toHaveLength(1);
    expect(await engine.listFlags('org-2')).toHaveLength(1);
  });

  it('registerFlag() accepts an optional description', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', description: 'The redesigned admin UI' });
    expect(flag.description).toBe('The redesigned admin UI');
  });

  it('isEnabled() ignores a tenant-scoped flag for a different tenant', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1' });
    await engine.enableFlag(ORG, flag.id);
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-2' })).toBe(false);
  });

  it('isEnabled() ignores an environment-scoped flag for a different environment within the same tenant', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', environmentId: 'env-1' });
    await engine.enableFlag(ORG, flag.id);
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-1', environmentId: 'env-2' })).toBe(false);
  });

  it('multiple flags with different keys do not interfere with each other', async () => {
    const { engine } = setup();
    const flagA = await engine.registerFlag(ORG, { key: 'flag-a' });
    await engine.registerFlag(ORG, { key: 'flag-b' });
    await engine.enableFlag(ORG, flagA.id);
    expect(await engine.isEnabled(ORG, 'flag-a')).toBe(true);
    expect(await engine.isEnabled(ORG, 'flag-b')).toBe(false);
  });

  it('disableFlag() throws FeatureFlagNotFoundError for an unknown flag', async () => {
    const { engine } = setup();
    await expect(engine.disableFlag(ORG, 'missing')).rejects.toBeInstanceOf(FeatureFlagNotFoundError);
  });

  it('registering two flags with the same key at different scopes keeps them independently addressable by id', async () => {
    const { engine } = setup();
    const orgWide = await engine.registerFlag(ORG, { key: 'new-ui' });
    const tenantScoped = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1' });
    expect(orgWide.id).not.toBe(tenantScoped.id);
    expect(await engine.listFlags(ORG)).toHaveLength(2);
  });

  it('enableFlag() on an already-enabled flag is idempotent', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', enabled: true });
    const enabled = await engine.enableFlag(ORG, flag.id);
    expect(enabled.enabled).toBe(true);
  });

  it('disableFlag() on an already-disabled flag is idempotent', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', enabled: false });
    const disabled = await engine.disableFlag(ORG, flag.id);
    expect(disabled.enabled).toBe(false);
  });

  it('isEnabled() with a tenantId but no matching org-wide default and no tenant override falls back to false', async () => {
    const { engine } = setup();
    expect(await engine.isEnabled(ORG, 'never-registered', { tenantId: 'tenant-1' })).toBe(false);
  });

  it('an environment-scoped flag without a matching tenantId does not match a resolution with a different tenantId', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', environmentId: 'env-1', enabled: true });
    await engine.enableFlag(ORG, flag.id);
    expect(await engine.isEnabled(ORG, 'new-ui', { tenantId: 'tenant-2', environmentId: 'env-1' })).toBe(false);
  });

  it('flags at different scopes for the same key can be toggled independently', async () => {
    const { engine } = setup();
    const orgWide = await engine.registerFlag(ORG, { key: 'new-ui', enabled: true });
    const tenantScoped = await engine.registerFlag(ORG, { key: 'new-ui', tenantId: 'tenant-1', enabled: true });
    await engine.disableFlag(ORG, tenantScoped.id);
    expect((await engine.getFlag(ORG, orgWide.id))?.enabled).toBe(true);
    expect((await engine.getFlag(ORG, tenantScoped.id))?.enabled).toBe(false);
  });

  it('getFlag() returns null for a flag id from a different organization', async () => {
    const { engine } = setup();
    const flag = await engine.registerFlag(ORG, { key: 'new-ui' });
    expect(await engine.getFlag('org-2', flag.id)).toBeNull();
  });

  it('isEnabled() is isolated per organization even for the same key', async () => {
    const { engine } = setup();
    const flagA = await engine.registerFlag(ORG, { key: 'new-ui', enabled: true });
    await engine.enableFlag(ORG, flagA.id);
    expect(await engine.isEnabled('org-2', 'new-ui')).toBe(false);
  });

  it('listFlags() returns an empty array for an organization with no registered flags', async () => {
    const { engine } = setup();
    expect(await engine.listFlags(ORG)).toEqual([]);
  });
});
