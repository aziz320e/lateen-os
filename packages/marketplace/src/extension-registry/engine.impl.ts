/**
 * Real Extension Registry — the extension lifecycle (install /
 * uninstall / enable / disable / upgrade), plus composite validation
 * intra-package over the Package Registry, Plugin Registry, and
 * Extension Sandbox.
 *
 * @module extension-registry/engine.impl
 */
import type { MarketplaceEventBus } from '../events/marketplace-event-bus.js';
import type { PackageRegistryEngine } from '../package-registry/engine.impl.js';
import type { PluginRegistryEngine } from '../plugin-registry/engine.impl.js';
import type { ExtensionSandboxEngine } from '../extension-sandbox/engine.impl.js';
import { DuplicateExtensionKeyError, ExtensionNotFoundError, InvalidExtensionTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ExtensionId, OrganizationId, PluginId } from '../shared/identifiers.js';
import type { ExtensionRepository } from './repository.js';
import type { Extension, ExtensionStatus } from './types.js';

const EXTENSION_TRANSITIONS: Readonly<Record<ExtensionStatus, readonly ExtensionStatus[]>> = {
  installed: ['enabled', 'uninstalled'],
  enabled: ['disabled', 'uninstalled'],
  disabled: ['enabled', 'uninstalled'],
  uninstalled: [],
};

/** Whether an extension may transition from one status to another. */
export function canTransitionExtension(from: ExtensionStatus, to: ExtensionStatus): boolean {
  return EXTENSION_TRANSITIONS[from].includes(to);
}

export interface InstallExtensionInput {
  readonly key: string;
  readonly name: string;
  readonly currentVersion: string;
  readonly pluginId?: PluginId;
}

export interface UpgradeExtensionInput {
  readonly toVersion: string;
}

export interface ValidateExtensionResult {
  readonly valid: boolean;
  readonly reasons: readonly string[];
}

export interface ExtensionRegistryEngine {
  install(organizationId: OrganizationId, input: InstallExtensionInput): Promise<Extension>;
  uninstall(organizationId: OrganizationId, extensionId: ExtensionId): Promise<Extension>;
  enable(organizationId: OrganizationId, extensionId: ExtensionId): Promise<Extension>;
  disable(organizationId: OrganizationId, extensionId: ExtensionId): Promise<Extension>;
  upgrade(organizationId: OrganizationId, extensionId: ExtensionId, input: UpgradeExtensionInput): Promise<Extension>;
  validateExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<ValidateExtensionResult>;
  getExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<Extension | null>;
  findByKey(organizationId: OrganizationId, key: string): Promise<Extension | null>;
  listExtensions(organizationId: OrganizationId): Promise<readonly Extension[]>;
}

/** Creates a real {@link ExtensionRegistryEngine}. */
export function createExtensionRegistryEngine(
  repository: ExtensionRepository,
  packageRegistry: Pick<PackageRegistryEngine, 'findVersion'>,
  pluginRegistry: Pick<PluginRegistryEngine, 'checkCompatibility'>,
  sandbox: Pick<ExtensionSandboxEngine, 'getSandboxProfileForExtension'>,
  eventBus?: MarketplaceEventBus,
  now: () => string = nowIso,
): ExtensionRegistryEngine {
  async function requireExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<Extension> {
    const extension = await repository.findById(organizationId, extensionId);
    if (!extension) throw new ExtensionNotFoundError(extensionId);
    return extension;
  }

  async function transition(organizationId: OrganizationId, extensionId: ExtensionId, to: ExtensionStatus): Promise<Extension> {
    const extension = await requireExtension(organizationId, extensionId);
    if (!canTransitionExtension(extension.status, to)) {
      throw new InvalidExtensionTransitionError(extensionId, extension.status, to);
    }
    const updated: Extension = { ...extension, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async install(organizationId, input) {
      const existing = await repository.findByKey(organizationId, input.key);
      if (existing) throw new DuplicateExtensionKeyError(input.key);

      const timestamp = now();
      const extension: Extension = {
        id: generateId('marketplace-extension'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        key: input.key,
        name: input.name,
        currentVersion: input.currentVersion,
        pluginId: input.pluginId,
        status: 'installed',
      };
      await repository.save(extension);
      eventBus?.publish('extension.installed', { organizationId, extensionId: extension.id, key: extension.key });
      return extension;
    },

    async uninstall(organizationId, extensionId) {
      const updated = await transition(organizationId, extensionId, 'uninstalled');
      eventBus?.publish('extension.uninstalled', { organizationId, extensionId: updated.id });
      return updated;
    },

    async enable(organizationId, extensionId) {
      const updated = await transition(organizationId, extensionId, 'enabled');
      eventBus?.publish('extension.enabled', { organizationId, extensionId: updated.id });
      return updated;
    },

    async disable(organizationId, extensionId) {
      const updated = await transition(organizationId, extensionId, 'disabled');
      eventBus?.publish('extension.disabled', { organizationId, extensionId: updated.id });
      return updated;
    },

    async upgrade(organizationId, extensionId, input) {
      const extension = await requireExtension(organizationId, extensionId);
      if (extension.status === 'uninstalled') {
        throw new InvalidExtensionTransitionError(extensionId, extension.status, 'upgraded');
      }
      const fromVersion = extension.currentVersion;
      const updated: Extension = { ...extension, currentVersion: input.toVersion, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('extension.upgraded', { organizationId, extensionId: updated.id, fromVersion, toVersion: input.toVersion });
      return updated;
    },

    async validateExtension(organizationId, extensionId) {
      const extension = await requireExtension(organizationId, extensionId);
      const reasons: string[] = [];

      const packageVersion = await packageRegistry.findVersion(organizationId, extension.key, extension.currentVersion);
      if (!packageVersion) reasons.push(`no published package version found for "${extension.key}@${extension.currentVersion}"`);

      if (extension.pluginId) {
        const compatibility = await pluginRegistry.checkCompatibility(organizationId, extension.pluginId, extension.currentVersion);
        if (!compatibility.compatible) reasons.push(compatibility.reason ?? 'plugin compatibility check failed');
      }

      const sandboxProfile = await sandbox.getSandboxProfileForExtension(organizationId, extensionId);
      if (!sandboxProfile) reasons.push('no sandbox profile registered for this extension');

      const valid = reasons.length === 0;
      eventBus?.publish('extension.validated', { organizationId, extensionId, valid });
      return { valid, reasons };
    },

    async getExtension(organizationId, extensionId) {
      return repository.findById(organizationId, extensionId);
    },

    async findByKey(organizationId, key) {
      return repository.findByKey(organizationId, key);
    },

    async listExtensions(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
