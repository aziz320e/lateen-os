import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { createSettingsEngine } from '../src/settings/engine.impl.js';
import { createSettingRepository } from '../src/settings/repository.impl.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createSettingsEngine(createSettingRepository(), eventBus);
  return { engine, eventBus };
}

describe('SettingsEngine', () => {
  it('upsertGlobalSetting() creates a global-scope setting at version 1', async () => {
    const { engine } = setup();
    const setting = await engine.upsertGlobalSetting('platform.name', 'Lateen OS');
    expect(setting.scope).toBe('global');
    expect(setting.version).toBe(1);
    expect(setting.value).toBe('Lateen OS');
    expect(setting.organizationId).toBeUndefined();
  });

  it('upsertOrganizationSetting() creates an organization-scope setting', async () => {
    const { engine } = setup();
    const setting = await engine.upsertOrganizationSetting(ORG, 'theme', 'dark');
    expect(setting.scope).toBe('organization');
    expect(setting.organizationId).toBe(ORG);
  });

  it('upsertTenantSetting() creates a tenant-scope setting', async () => {
    const { engine } = setup();
    const setting = await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'light');
    expect(setting.scope).toBe('tenant');
    expect(setting.organizationId).toBe(ORG);
    expect(setting.tenantId).toBe('tenant-1');
  });

  it('publishes settings.updated on every upsert', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('settings.updated', (payload) => (seen = payload));
    const setting = await engine.upsertOrganizationSetting(ORG, 'theme', 'dark');
    expect(seen).toEqual({ organizationId: ORG, settingId: setting.id, key: 'theme', scope: 'organization' });
  });

  it('re-upserting the same (scope, key) increments the version and records history', async () => {
    const { engine } = setup();
    await engine.upsertOrganizationSetting(ORG, 'theme', 'dark');
    const second = await engine.upsertOrganizationSetting(ORG, 'theme', 'light');
    expect(second.version).toBe(2);
    expect(second.value).toBe('light');
    expect(second.history).toEqual([
      { version: 1, value: 'dark', changedAt: second.history[0]?.changedAt },
      { version: 2, value: 'light', changedAt: second.history[1]?.changedAt },
    ]);
  });

  it('the same key at different scopes does not collide', async () => {
    const { engine } = setup();
    await engine.upsertGlobalSetting('theme', 'global-default');
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'tenant-default');
    const all = await engine.listSettings();
    expect(all).toHaveLength(3);
  });

  it('getEffectiveSetting() resolves tenant override over organization default over global default', async () => {
    const { engine } = setup();
    await engine.upsertGlobalSetting('theme', 'global-default');
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'tenant-default');

    expect((await engine.getEffectiveSetting(ORG, 'theme', 'tenant-1'))?.value).toBe('tenant-default');
    expect((await engine.getEffectiveSetting(ORG, 'theme'))?.value).toBe('org-default');
  });

  it('getEffectiveSetting() falls back to the global default when no organization override exists', async () => {
    const { engine } = setup();
    await engine.upsertGlobalSetting('theme', 'global-default');
    expect((await engine.getEffectiveSetting(ORG, 'theme'))?.value).toBe('global-default');
  });

  it('getEffectiveSetting() falls back to the organization default when the requested tenant has no override', async () => {
    const { engine } = setup();
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    expect((await engine.getEffectiveSetting(ORG, 'theme', 'tenant-without-override'))?.value).toBe('org-default');
  });

  it('getEffectiveSetting() returns null when nothing is configured at any scope', async () => {
    const { engine } = setup();
    expect(await engine.getEffectiveSetting(ORG, 'unknown-key')).toBeNull();
  });

  it('getSetting()/listSettings() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getSetting('missing')).toBeNull();
    const setting = await engine.upsertOrganizationSetting(ORG, 'theme', 'dark');
    expect(await engine.getSetting(setting.id)).toEqual(setting);
    expect(await engine.listSettings()).toHaveLength(1);
  });

  it('listSettingsForOrganization() excludes global settings and other organizations', async () => {
    const { engine } = setup();
    await engine.upsertGlobalSetting('theme', 'global-default');
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    await engine.upsertOrganizationSetting('org-2', 'theme', 'other-org-default');
    const settings = await engine.listSettingsForOrganization(ORG);
    expect(settings).toHaveLength(1);
    expect(settings[0]?.organizationId).toBe(ORG);
  });

  it('listSettingsForOrganization() includes both organization- and tenant-scoped settings for that organization', async () => {
    const { engine } = setup();
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'tenant-default');
    expect(await engine.listSettingsForOrganization(ORG)).toHaveLength(2);
  });

  it('re-upserting a tenant setting three times accumulates a full 3-entry history', async () => {
    const { engine } = setup();
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'v1');
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'v2');
    const third = await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'v3');
    expect(third.version).toBe(3);
    expect(third.history.map((record) => record.value)).toEqual(['v1', 'v2', 'v3']);
  });

  it('a setting value can be a complex object, not just a primitive', async () => {
    const { engine } = setup();
    const setting = await engine.upsertOrganizationSetting(ORG, 'limits', { maxUsers: 50, maxTenants: 5 });
    expect(setting.value).toEqual({ maxUsers: 50, maxTenants: 5 });
  });

  it('getEffectiveSetting() with no tenantId argument never considers tenant-scoped settings', async () => {
    const { engine } = setup();
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'tenant-default');
    await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    expect((await engine.getEffectiveSetting(ORG, 'theme'))?.value).toBe('org-default');
  });

  it('settings at the same scope but different keys do not collide', async () => {
    const { engine } = setup();
    await engine.upsertOrganizationSetting(ORG, 'theme', 'dark');
    await engine.upsertOrganizationSetting(ORG, 'locale', 'en-US');
    expect(await engine.listSettingsForOrganization(ORG)).toHaveLength(2);
  });

  it('a fresh setting’s history has exactly one entry matching its initial value', async () => {
    const { engine } = setup();
    const setting = await engine.upsertGlobalSetting('platform.name', 'Lateen OS');
    expect(setting.history).toEqual([{ version: 1, value: 'Lateen OS', changedAt: setting.history[0]?.changedAt }]);
  });

  it('two different tenants under the same organization can hold independent tenant-scoped settings', async () => {
    const { engine } = setup();
    await engine.upsertTenantSetting(ORG, 'tenant-a', 'theme', 'dark');
    await engine.upsertTenantSetting(ORG, 'tenant-b', 'theme', 'light');
    expect((await engine.getEffectiveSetting(ORG, 'theme', 'tenant-a'))?.value).toBe('dark');
    expect((await engine.getEffectiveSetting(ORG, 'theme', 'tenant-b'))?.value).toBe('light');
  });

  it('upsertGlobalSetting() called for two different keys creates two independent settings', async () => {
    const { engine } = setup();
    await engine.upsertGlobalSetting('platform.name', 'Lateen OS');
    await engine.upsertGlobalSetting('platform.version', '1.0');
    expect(await engine.listSettings()).toHaveLength(2);
  });

  it('a setting value can be a boolean or a number, not just a string', async () => {
    const { engine } = setup();
    const boolSetting = await engine.upsertOrganizationSetting(ORG, 'maintenance_mode', false);
    const numberSetting = await engine.upsertOrganizationSetting(ORG, 'max_seats', 100);
    expect(boolSetting.value).toBe(false);
    expect(numberSetting.value).toBe(100);
  });

  it('getSetting() returns null for an id that was never created', async () => {
    const { engine } = setup();
    expect(await engine.getSetting('never-created')).toBeNull();
  });

  it('a global setting and an organization setting with the same key have different ids', async () => {
    const { engine } = setup();
    const globalSetting = await engine.upsertGlobalSetting('theme', 'global-default');
    const orgSetting = await engine.upsertOrganizationSetting(ORG, 'theme', 'org-default');
    expect(globalSetting.id).not.toBe(orgSetting.id);
  });

  it('upserting a tenant setting does not create or affect the organization-level setting of the same key', async () => {
    const { engine } = setup();
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'theme', 'tenant-default');
    expect(await engine.getEffectiveSetting(ORG, 'theme')).toBeNull();
  });

  it('settings.updated fires once per upsert call, not once per scope level', async () => {
    const { engine, eventBus } = setup();
    let count = 0;
    eventBus.subscribe('settings.updated', () => (count += 1));
    await engine.upsertGlobalSetting('a', 1);
    await engine.upsertOrganizationSetting(ORG, 'b', 2);
    await engine.upsertTenantSetting(ORG, 'tenant-1', 'c', 3);
    expect(count).toBe(3);
  });
});
