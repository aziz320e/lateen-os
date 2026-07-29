/**
 * Real Plugin Registry — plugins, their declared capabilities and
 * required permissions, and deterministic version-range compatibility
 * checking (never a full package manager, never code execution).
 *
 * @module plugin-registry/engine.impl
 */
import type { MarketplaceEventBus } from '../events/marketplace-event-bus.js';
import { InvalidPluginTransitionError, PluginNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PluginId } from '../shared/identifiers.js';
import { satisfiesRange } from '../shared/semver.js';
import type { PluginRepository } from './repository.js';
import type { Plugin, PluginStatus } from './types.js';

const PLUGIN_TRANSITIONS: Readonly<Record<PluginStatus, readonly PluginStatus[]>> = {
  active: ['deprecated', 'archived'],
  deprecated: ['active', 'archived'],
  archived: [],
};

/** Whether a plugin may transition from one status to another. */
export function canTransitionPlugin(from: PluginStatus, to: PluginStatus): boolean {
  return PLUGIN_TRANSITIONS[from].includes(to);
}

export interface RegisterPluginInput {
  readonly key: string;
  readonly name: string;
  readonly capabilities?: readonly string[];
  readonly requiredPermissions?: readonly string[];
  readonly compatibleVersionRange: string;
}

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly reason?: string;
}

export interface PluginRegistryEngine {
  registerPlugin(organizationId: OrganizationId, input: RegisterPluginInput): Promise<Plugin>;
  deprecatePlugin(organizationId: OrganizationId, pluginId: PluginId): Promise<Plugin>;
  reactivatePlugin(organizationId: OrganizationId, pluginId: PluginId): Promise<Plugin>;
  archivePlugin(organizationId: OrganizationId, pluginId: PluginId): Promise<Plugin>;
  checkCompatibility(organizationId: OrganizationId, pluginId: PluginId, hostVersion: string): Promise<CompatibilityResult>;
  getPlugin(organizationId: OrganizationId, pluginId: PluginId): Promise<Plugin | null>;
  findByKey(organizationId: OrganizationId, key: string): Promise<Plugin | null>;
  listPlugins(organizationId: OrganizationId): Promise<readonly Plugin[]>;
}

/** Creates a real {@link PluginRegistryEngine}. */
export function createPluginRegistryEngine(repository: PluginRepository, eventBus?: MarketplaceEventBus, now: () => string = nowIso): PluginRegistryEngine {
  async function requirePlugin(organizationId: OrganizationId, pluginId: PluginId): Promise<Plugin> {
    const plugin = await repository.findById(organizationId, pluginId);
    if (!plugin) throw new PluginNotFoundError(pluginId);
    return plugin;
  }

  async function transition(organizationId: OrganizationId, pluginId: PluginId, to: PluginStatus): Promise<Plugin> {
    const plugin = await requirePlugin(organizationId, pluginId);
    if (!canTransitionPlugin(plugin.status, to)) {
      throw new InvalidPluginTransitionError(pluginId, plugin.status, to);
    }
    const updated: Plugin = { ...plugin, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async registerPlugin(organizationId, input) {
      const timestamp = now();
      const plugin: Plugin = {
        id: generateId('marketplace-plugin'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        key: input.key,
        name: input.name,
        capabilities: input.capabilities ?? [],
        requiredPermissions: input.requiredPermissions ?? [],
        compatibleVersionRange: input.compatibleVersionRange,
        status: 'active',
      };
      await repository.save(plugin);
      eventBus?.publish('plugin.registered', { organizationId, pluginId: plugin.id, key: plugin.key });
      return plugin;
    },

    async deprecatePlugin(organizationId, pluginId) {
      return transition(organizationId, pluginId, 'deprecated');
    },

    async reactivatePlugin(organizationId, pluginId) {
      return transition(organizationId, pluginId, 'active');
    },

    async archivePlugin(organizationId, pluginId) {
      return transition(organizationId, pluginId, 'archived');
    },

    async checkCompatibility(organizationId, pluginId, hostVersion) {
      const plugin = await requirePlugin(organizationId, pluginId);
      const compatible = satisfiesRange(hostVersion, plugin.compatibleVersionRange);
      eventBus?.publish('compatibility.checked', { organizationId, subjectId: pluginId, compatible });
      return compatible ? { compatible: true } : { compatible: false, reason: `host version "${hostVersion}" does not satisfy "${plugin.compatibleVersionRange}"` };
    },

    async getPlugin(organizationId, pluginId) {
      return repository.findById(organizationId, pluginId);
    },

    async findByKey(organizationId, key) {
      return repository.findByKey(organizationId, key);
    },

    async listPlugins(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
