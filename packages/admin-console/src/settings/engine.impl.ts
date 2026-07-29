/**
 * Real System Settings engine — global, tenant, and organization
 * settings, each independently versioned with a full change history.
 * Effective resolution follows a fixed precedence: tenant overrides
 * organization overrides global.
 *
 * @module settings/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SettingId, TenantId } from '../shared/identifiers.js';
import type { SettingRepository } from './repository.js';
import type { Setting, SettingScope } from './types.js';

function upsertAt(
  existing: Setting | undefined,
  scope: SettingScope,
  key: string,
  value: unknown,
  now: string,
  organizationId?: OrganizationId,
  tenantId?: TenantId,
): Setting {
  if (!existing) {
    return {
      id: generateId('admin-setting'),
      createdAt: now,
      updatedAt: now,
      scope,
      organizationId,
      tenantId,
      key,
      value,
      version: 1,
      history: [{ version: 1, value, changedAt: now }],
    };
  }
  const version = existing.version + 1;
  return {
    ...existing,
    value,
    version,
    updatedAt: now,
    history: [...existing.history, { version, value, changedAt: now }],
  };
}

export interface SettingsEngine {
  upsertGlobalSetting(key: string, value: unknown): Promise<Setting>;
  upsertOrganizationSetting(organizationId: OrganizationId, key: string, value: unknown): Promise<Setting>;
  upsertTenantSetting(organizationId: OrganizationId, tenantId: TenantId, key: string, value: unknown): Promise<Setting>;
  getEffectiveSetting(organizationId: OrganizationId, key: string, tenantId?: TenantId): Promise<Setting | null>;
  getSetting(settingId: SettingId): Promise<Setting | null>;
  listSettings(): Promise<readonly Setting[]>;
  listSettingsForOrganization(organizationId: OrganizationId): Promise<readonly Setting[]>;
}

/** Creates a real {@link SettingsEngine}. */
export function createSettingsEngine(repository: SettingRepository, eventBus?: AdminEventBus, now: () => string = nowIso): SettingsEngine {
  async function findExisting(scope: SettingScope, key: string, organizationId?: OrganizationId, tenantId?: TenantId): Promise<Setting | undefined> {
    const all = await repository.findAll();
    return all.find((setting) => setting.scope === scope && setting.key === key && setting.organizationId === organizationId && setting.tenantId === tenantId);
  }

  async function upsert(scope: SettingScope, key: string, value: unknown, organizationId?: OrganizationId, tenantId?: TenantId): Promise<Setting> {
    const existing = await findExisting(scope, key, organizationId, tenantId);
    const updated = upsertAt(existing, scope, key, value, now(), organizationId, tenantId);
    await repository.save(updated);
    eventBus?.publish('settings.updated', { organizationId: organizationId ?? '', settingId: updated.id, key, scope });
    return updated;
  }

  return {
    async upsertGlobalSetting(key, value) {
      return upsert('global', key, value);
    },

    async upsertOrganizationSetting(organizationId, key, value) {
      return upsert('organization', key, value, organizationId);
    },

    async upsertTenantSetting(organizationId, tenantId, key, value) {
      return upsert('tenant', key, value, organizationId, tenantId);
    },

    async getEffectiveSetting(organizationId, key, tenantId) {
      if (tenantId) {
        const tenantSetting = await findExisting('tenant', key, organizationId, tenantId);
        if (tenantSetting) return tenantSetting;
      }
      const organizationSetting = await findExisting('organization', key, organizationId);
      if (organizationSetting) return organizationSetting;
      const globalSetting = await findExisting('global', key);
      return globalSetting ?? null;
    },

    async getSetting(settingId) {
      return repository.findById(settingId);
    },

    async listSettings() {
      return repository.findAll();
    },

    async listSettingsForOrganization(organizationId) {
      const all = await repository.findAll();
      return all.filter((setting) => setting.organizationId === organizationId);
    },
  };
}
