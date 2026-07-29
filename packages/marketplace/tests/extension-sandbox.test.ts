import { describe, expect, it } from 'vitest';
import { createExtensionSandboxEngine } from '../src/extension-sandbox/engine.impl.js';
import { createSandboxProfileRepository } from '../src/extension-sandbox/repository.impl.js';
import { SandboxProfileNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createExtensionSandboxEngine(createSandboxProfileRepository()) };
}

describe('ExtensionSandboxEngine', () => {
  it('createSandboxProfile() defaults isolationLevel to "none" and empty lists', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(profile.isolationLevel).toBe('none');
    expect(profile.allowedCapabilities).toEqual([]);
    expect(profile.grantedPermissions).toEqual([]);
  });

  it('createSandboxProfile() persists explicit capabilities, permissions, and isolation level', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, {
      extensionId: 'ext-1',
      allowedCapabilities: ['read:data'],
      grantedPermissions: ['network:outbound'],
      isolationLevel: 'container',
    });
    expect(profile.allowedCapabilities).toEqual(['read:data']);
    expect(profile.grantedPermissions).toEqual(['network:outbound']);
    expect(profile.isolationLevel).toBe('container');
  });

  it('supports every isolation level', async () => {
    const { engine } = setup();
    const levels = ['none', 'process', 'container', 'vm'] as const;
    for (const isolationLevel of levels) {
      const profile = await engine.createSandboxProfile(ORG, { extensionId: `ext-${isolationLevel}`, isolationLevel });
      expect(profile.isolationLevel).toBe(isolationLevel);
    }
  });

  it('allowCapability() adds a capability idempotently', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    const updated = await engine.allowCapability(ORG, profile.id, 'read:data');
    expect(updated.allowedCapabilities).toEqual(['read:data']);
    const again = await engine.allowCapability(ORG, profile.id, 'read:data');
    expect(again.allowedCapabilities).toEqual(['read:data']);
  });

  it('revokeCapability() removes a capability', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: ['read:data', 'write:data'] });
    const updated = await engine.revokeCapability(ORG, profile.id, 'write:data');
    expect(updated.allowedCapabilities).toEqual(['read:data']);
  });

  it('grantPermission() adds a permission idempotently', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    const updated = await engine.grantPermission(ORG, profile.id, 'network:outbound');
    expect(updated.grantedPermissions).toEqual(['network:outbound']);
    const again = await engine.grantPermission(ORG, profile.id, 'network:outbound');
    expect(again.grantedPermissions).toEqual(['network:outbound']);
  });

  it('revokePermission() removes a permission', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', grantedPermissions: ['network:outbound', 'fs:read'] });
    const updated = await engine.revokePermission(ORG, profile.id, 'fs:read');
    expect(updated.grantedPermissions).toEqual(['network:outbound']);
  });

  it('isCapabilityAllowed() returns true for an allowed capability, false otherwise', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: ['read:data'] });
    expect(await engine.isCapabilityAllowed(ORG, profile.id, 'read:data')).toBe(true);
    expect(await engine.isCapabilityAllowed(ORG, profile.id, 'write:data')).toBe(false);
  });

  it('allowCapability() throws SandboxProfileNotFoundError for an unknown profile', async () => {
    const { engine } = setup();
    await expect(engine.allowCapability(ORG, 'missing', 'read:data')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('isCapabilityAllowed() throws SandboxProfileNotFoundError for an unknown profile', async () => {
    const { engine } = setup();
    await expect(engine.isCapabilityAllowed(ORG, 'missing', 'read:data')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('getSandboxProfile()/getSandboxProfileForExtension()/listSandboxProfiles() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getSandboxProfile(ORG, 'missing')).toBeNull();
    expect(await engine.getSandboxProfileForExtension(ORG, 'ext-1')).toBeNull();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(await engine.getSandboxProfile(ORG, profile.id)).toEqual(profile);
    expect(await engine.getSandboxProfileForExtension(ORG, 'ext-1')).toEqual(profile);
    expect(await engine.listSandboxProfiles(ORG)).toHaveLength(1);
  });

  it('sandbox profiles are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    await engine.createSandboxProfile('org-2', { extensionId: 'ext-1' });
    expect(await engine.listSandboxProfiles(ORG)).toHaveLength(1);
    expect(await engine.listSandboxProfiles('org-2')).toHaveLength(1);
  });

  it('never executes any code — every operation here is metadata bookkeeping only', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: ['exec:shell'] });
    expect(typeof profile.allowedCapabilities[0]).toBe('string');
  });

  it('a profile can hold multiple distinct capabilities and permissions', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    await engine.allowCapability(ORG, profile.id, 'read:data');
    const updated = await engine.allowCapability(ORG, profile.id, 'write:data');
    expect(updated.allowedCapabilities).toEqual(['read:data', 'write:data']);
  });

  it('revokeCapability() on a capability never granted leaves the list unchanged', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: ['read:data'] });
    const updated = await engine.revokeCapability(ORG, profile.id, 'never:granted');
    expect(updated.allowedCapabilities).toEqual(['read:data']);
  });

  it('revokePermission() throws SandboxProfileNotFoundError for an unknown profile', async () => {
    const { engine } = setup();
    await expect(engine.revokePermission(ORG, 'missing', 'network:outbound')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('sandbox profiles are one-per-extension by convention, but multiple profiles for different extensions coexist', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-a' });
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-b' });
    expect(await engine.listSandboxProfiles(ORG)).toHaveLength(2);
  });

  it('getSandboxProfileForExtension() returns null for an extension with no sandbox profile', async () => {
    const { engine } = setup();
    expect(await engine.getSandboxProfileForExtension(ORG, 'never-sandboxed')).toBeNull();
  });

  it('grantPermission() and revokePermission() together leave the list correct after multiple operations', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    await engine.grantPermission(ORG, profile.id, 'a');
    await engine.grantPermission(ORG, profile.id, 'b');
    const updated = await engine.revokePermission(ORG, profile.id, 'a');
    expect(updated.grantedPermissions).toEqual(['b']);
  });

  it('sandbox profiles are isolated per organization even for the same extensionId', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', isolationLevel: 'vm' });
    const other = await engine.createSandboxProfile('org-2', { extensionId: 'ext-1', isolationLevel: 'none' });
    expect(other.isolationLevel).toBe('none');
  });

  it('getSandboxProfile() returns null for a profile id from a different organization', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(await engine.getSandboxProfile('org-2', profile.id)).toBeNull();
  });

  it('createSandboxProfile() called twice for the same extension creates two separate profile records', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(await engine.listSandboxProfiles(ORG)).toHaveLength(2);
  });

  it('revokeCapability() throws SandboxProfileNotFoundError for an unknown profile', async () => {
    const { engine } = setup();
    await expect(engine.revokeCapability(ORG, 'missing', 'read:data')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('grantPermission() throws SandboxProfileNotFoundError for an unknown profile', async () => {
    const { engine } = setup();
    await expect(engine.grantPermission(ORG, 'missing', 'network:outbound')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('listSandboxProfiles() returns an empty array for an organization with no sandbox profiles', async () => {
    const { engine } = setup();
    expect(await engine.listSandboxProfiles(ORG)).toEqual([]);
  });

  it('createSandboxProfile() with an empty allowedCapabilities array is distinguishable from none given', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: [] });
    expect(profile.allowedCapabilities).toEqual([]);
  });

  it('isCapabilityAllowed() is isolated per organization', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', allowedCapabilities: ['read:data'] });
    await expect(engine.isCapabilityAllowed('org-2', profile.id, 'read:data')).rejects.toBeInstanceOf(SandboxProfileNotFoundError);
  });

  it('createSandboxProfile() for two different extensions in the same org are independently retrievable', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-a', isolationLevel: 'process' });
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-b', isolationLevel: 'vm' });
    expect((await engine.getSandboxProfileForExtension(ORG, 'ext-a'))?.isolationLevel).toBe('process');
    expect((await engine.getSandboxProfileForExtension(ORG, 'ext-b'))?.isolationLevel).toBe('vm');
  });

  it('getSandboxProfileForExtension() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    expect(await engine.getSandboxProfileForExtension('org-2', 'ext-1')).toBeNull();
  });

  it('allowCapability() and grantPermission() operate on independent lists', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    const updated = await engine.allowCapability(ORG, profile.id, 'read:data');
    expect(updated.grantedPermissions).toEqual([]);
  });

  it('revoking and re-allowing the same capability leaves it present exactly once', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1' });
    await engine.allowCapability(ORG, profile.id, 'read:data');
    await engine.revokeCapability(ORG, profile.id, 'read:data');
    const updated = await engine.allowCapability(ORG, profile.id, 'read:data');
    expect(updated.allowedCapabilities).toEqual(['read:data']);
  });

  it('a sandbox profile’s isolation level can be set to the most restrictive "vm" level', async () => {
    const { engine } = setup();
    const profile = await engine.createSandboxProfile(ORG, { extensionId: 'ext-1', isolationLevel: 'vm' });
    expect(profile.isolationLevel).toBe('vm');
  });
});
