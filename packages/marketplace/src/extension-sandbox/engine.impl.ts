/**
 * Real Extension Sandbox — deterministic capability/permission/
 * isolation metadata for one extension. **No code execution anywhere
 * in this module** — every check here is a plain set-membership
 * lookup over stored metadata.
 *
 * @module extension-sandbox/engine.impl
 */
import { SandboxProfileNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ExtensionId, OrganizationId, SandboxProfileId } from '../shared/identifiers.js';
import type { SandboxProfileRepository } from './repository.js';
import type { IsolationLevel, SandboxProfile } from './types.js';

export interface CreateSandboxProfileInput {
  readonly extensionId: ExtensionId;
  readonly allowedCapabilities?: readonly string[];
  readonly grantedPermissions?: readonly string[];
  readonly isolationLevel?: IsolationLevel;
}

export interface ExtensionSandboxEngine {
  createSandboxProfile(organizationId: OrganizationId, input: CreateSandboxProfileInput): Promise<SandboxProfile>;
  allowCapability(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId, capability: string): Promise<SandboxProfile>;
  revokeCapability(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId, capability: string): Promise<SandboxProfile>;
  grantPermission(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId, permission: string): Promise<SandboxProfile>;
  revokePermission(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId, permission: string): Promise<SandboxProfile>;
  isCapabilityAllowed(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId, capability: string): Promise<boolean>;
  getSandboxProfile(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId): Promise<SandboxProfile | null>;
  getSandboxProfileForExtension(organizationId: OrganizationId, extensionId: ExtensionId): Promise<SandboxProfile | null>;
  listSandboxProfiles(organizationId: OrganizationId): Promise<readonly SandboxProfile[]>;
}

/** Creates a real {@link ExtensionSandboxEngine}. */
export function createExtensionSandboxEngine(repository: SandboxProfileRepository, now: () => string = nowIso): ExtensionSandboxEngine {
  async function requireProfile(organizationId: OrganizationId, sandboxProfileId: SandboxProfileId): Promise<SandboxProfile> {
    const profile = await repository.findById(organizationId, sandboxProfileId);
    if (!profile) throw new SandboxProfileNotFoundError(sandboxProfileId);
    return profile;
  }

  return {
    async createSandboxProfile(organizationId, input) {
      const timestamp = now();
      const profile: SandboxProfile = {
        id: generateId('marketplace-sandbox'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        extensionId: input.extensionId,
        allowedCapabilities: input.allowedCapabilities ?? [],
        grantedPermissions: input.grantedPermissions ?? [],
        isolationLevel: input.isolationLevel ?? 'none',
      };
      await repository.save(profile);
      return profile;
    },

    async allowCapability(organizationId, sandboxProfileId, capability) {
      const profile = await requireProfile(organizationId, sandboxProfileId);
      if (profile.allowedCapabilities.includes(capability)) return profile;
      const updated: SandboxProfile = { ...profile, allowedCapabilities: [...profile.allowedCapabilities, capability], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async revokeCapability(organizationId, sandboxProfileId, capability) {
      const profile = await requireProfile(organizationId, sandboxProfileId);
      const updated: SandboxProfile = { ...profile, allowedCapabilities: profile.allowedCapabilities.filter((existing) => existing !== capability), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async grantPermission(organizationId, sandboxProfileId, permission) {
      const profile = await requireProfile(organizationId, sandboxProfileId);
      if (profile.grantedPermissions.includes(permission)) return profile;
      const updated: SandboxProfile = { ...profile, grantedPermissions: [...profile.grantedPermissions, permission], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async revokePermission(organizationId, sandboxProfileId, permission) {
      const profile = await requireProfile(organizationId, sandboxProfileId);
      const updated: SandboxProfile = { ...profile, grantedPermissions: profile.grantedPermissions.filter((existing) => existing !== permission), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async isCapabilityAllowed(organizationId, sandboxProfileId, capability) {
      const profile = await requireProfile(organizationId, sandboxProfileId);
      return profile.allowedCapabilities.includes(capability);
    },

    async getSandboxProfile(organizationId, sandboxProfileId) {
      return repository.findById(organizationId, sandboxProfileId);
    },

    async getSandboxProfileForExtension(organizationId, extensionId) {
      return repository.findByExtension(organizationId, extensionId);
    },

    async listSandboxProfiles(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
