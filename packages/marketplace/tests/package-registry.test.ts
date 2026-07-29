import { describe, expect, it } from 'vitest';
import { computeSignature, createPackageRegistryEngine } from '../src/package-registry/engine.impl.js';
import { createPackageVersionRepository } from '../src/package-registry/repository.impl.js';
import { DuplicatePackageVersionError, PackageVersionNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createPackageRegistryEngine(createPackageVersionRepository()) };
}

describe('computeSignature (pure)', () => {
  it('is deterministic for the same inputs', () => {
    const a = computeSignature('com.acme.widget', '1.0.0', [{ key: 'com.acme.core', versionRange: '>=1.0.0' }]);
    const b = computeSignature('com.acme.widget', '1.0.0', [{ key: 'com.acme.core', versionRange: '>=1.0.0' }]);
    expect(a).toBe(b);
  });

  it('is order-independent over the dependency list', () => {
    const a = computeSignature('com.acme.widget', '1.0.0', [
      { key: 'com.acme.core', versionRange: '>=1.0.0' },
      { key: 'com.acme.ui', versionRange: '>=2.0.0' },
    ]);
    const b = computeSignature('com.acme.widget', '1.0.0', [
      { key: 'com.acme.ui', versionRange: '>=2.0.0' },
      { key: 'com.acme.core', versionRange: '>=1.0.0' },
    ]);
    expect(a).toBe(b);
  });

  it('differs when the version differs', () => {
    const a = computeSignature('com.acme.widget', '1.0.0', []);
    const b = computeSignature('com.acme.widget', '1.0.1', []);
    expect(a).not.toBe(b);
  });

  it('differs when the extensionKey differs', () => {
    const a = computeSignature('com.acme.widget', '1.0.0', []);
    const b = computeSignature('com.acme.other', '1.0.0', []);
    expect(a).not.toBe(b);
  });

  it('produces a real 64-character hex SHA-256 digest', () => {
    const signature = computeSignature('com.acme.widget', '1.0.0', []);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('PackageRegistryEngine', () => {
  it('publishVersion() computes and persists a real signature', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(packageVersion.signature).toBe(computeSignature('com.acme.widget', '1.0.0', []));
  });

  it('publishVersion() persists dependencies verbatim', async () => {
    const { engine } = setup();
    const dependencies = [{ key: 'com.acme.core', versionRange: '>=1.0.0' }];
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0', dependencies });
    expect(packageVersion.dependencies).toEqual(dependencies);
  });

  it('publishVersion() rejects a duplicate (extensionKey, version) pair', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await expect(engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' })).rejects.toBeInstanceOf(DuplicatePackageVersionError);
  });

  it('allows the same extensionKey at a different version', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await expect(engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.1.0' })).resolves.toBeTruthy();
  });

  it('verifySignature() returns true for the real, matching signature', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.verifySignature(ORG, packageVersion.id, packageVersion.signature)).toBe(true);
  });

  it('verifySignature() returns false for a tampered signature', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.verifySignature(ORG, packageVersion.id, 'not-the-real-signature')).toBe(false);
  });

  it('verifySignature() throws PackageVersionNotFoundError for an unknown version', async () => {
    const { engine } = setup();
    await expect(engine.verifySignature(ORG, 'missing', 'anything')).rejects.toBeInstanceOf(PackageVersionNotFoundError);
  });

  it('getVersion()/findVersion() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getVersion(ORG, 'missing')).toBeNull();
    expect(await engine.findVersion(ORG, 'com.acme.widget', '1.0.0')).toBeNull();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.getVersion(ORG, packageVersion.id)).toEqual(packageVersion);
    expect(await engine.findVersion(ORG, 'com.acme.widget', '1.0.0')).toEqual(packageVersion);
  });

  it('listVersionsForExtension() returns only that extension’s versions', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.1.0' });
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.other', version: '1.0.0' });
    expect(await engine.listVersionsForExtension(ORG, 'com.acme.widget')).toHaveLength(2);
  });

  it('findDependents() finds every version that depends on a given key', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0', dependencies: [{ key: 'com.acme.core', versionRange: '>=1.0.0' }] });
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.other', version: '1.0.0', dependencies: [] });
    const dependents = await engine.findDependents(ORG, 'com.acme.core');
    expect(dependents).toHaveLength(1);
    expect(dependents[0]?.extensionKey).toBe('com.acme.widget');
  });

  it('findDependents() returns an empty array when nothing depends on the given key', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.findDependents(ORG, 'never-referenced')).toEqual([]);
  });

  it('listAllVersions() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await engine.publishVersion('org-2', { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.listAllVersions(ORG)).toHaveLength(1);
    expect(await engine.listAllVersions('org-2')).toHaveLength(1);
  });

  it('publishedAt equals createdAt for a freshly published version', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(packageVersion.publishedAt).toBe(packageVersion.createdAt);
  });

  it('publishVersion() defaults dependencies to an empty array when none are given', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(packageVersion.dependencies).toEqual([]);
  });

  it('the same extensionKey+version pair is allowed in a different organization', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await expect(engine.publishVersion('org-2', { extensionKey: 'com.acme.widget', version: '1.0.0' })).resolves.toBeTruthy();
  });

  it('findVersion() returns null for a known extensionKey but unknown version', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.findVersion(ORG, 'com.acme.widget', '2.0.0')).toBeNull();
  });

  it('a package can declare multiple dependencies', async () => {
    const { engine } = setup();
    const dependencies = [
      { key: 'com.acme.core', versionRange: '>=1.0.0' },
      { key: 'com.acme.ui', versionRange: '>=2.0.0' },
    ];
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0', dependencies });
    expect(packageVersion.dependencies).toHaveLength(2);
  });

  it('findDependents() can find multiple dependents of the same key', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0', dependencies: [{ key: 'com.acme.core', versionRange: '>=1.0.0' }] });
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.tool', version: '1.0.0', dependencies: [{ key: 'com.acme.core', versionRange: '>=1.0.0' }] });
    expect(await engine.findDependents(ORG, 'com.acme.core')).toHaveLength(2);
  });

  it('listVersionsForExtension() returns an empty array for an extension with no published versions', async () => {
    const { engine } = setup();
    expect(await engine.listVersionsForExtension(ORG, 'never-published')).toEqual([]);
  });

  it('computeSignature is a real, deterministic SHA-256 hex digest of consistent length across many inputs', () => {
    const signatures = [
      computeSignature('a', '1.0.0', []),
      computeSignature('b', '2.0.0', [{ key: 'x', versionRange: '>=1.0.0' }]),
      computeSignature('com.acme.long-widget-name', '10.20.30', []),
    ];
    for (const signature of signatures) {
      expect(signature).toHaveLength(64);
    }
  });

  it('two packages with identical extensionKey/version but different dependencies have different signatures', () => {
    const a = computeSignature('com.acme.widget', '1.0.0', [{ key: 'x', versionRange: '>=1.0.0' }]);
    const b = computeSignature('com.acme.widget', '1.0.0', [{ key: 'y', versionRange: '>=1.0.0' }]);
    expect(a).not.toBe(b);
  });

  it('getVersion() returns null for a version id from a different organization', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.getVersion('org-2', packageVersion.id)).toBeNull();
  });

  it('publishVersion() with no dependencies produces the same signature as an empty dependencies array', async () => {
    const { engine } = setup();
    const withUndefined = await engine.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0' });
    const withEmpty = await engine.publishVersion(ORG, { extensionKey: 'b', version: '1.0.0', dependencies: [] });
    expect(withUndefined.signature).toBe(computeSignature('a', '1.0.0', []));
    expect(withEmpty.signature).toBe(computeSignature('b', '1.0.0', []));
  });

  it('verifySignature() is isolated per organization', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    await expect(engine.verifySignature('org-2', packageVersion.id, packageVersion.signature)).rejects.toBeInstanceOf(PackageVersionNotFoundError);
  });

  it('findVersion() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'com.acme.widget', version: '1.0.0' });
    expect(await engine.findVersion('org-2', 'com.acme.widget', '1.0.0')).toBeNull();
  });

  it('findDependents() is isolated per organization', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'a', version: '1.0.0', dependencies: [{ key: 'core', versionRange: '>=1.0.0' }] });
    expect(await engine.findDependents('org-2', 'core')).toEqual([]);
  });

  it('publishVersion() with three or more dependencies computes a stable signature regardless of insertion order', () => {
    const dependencies = [
      { key: 'z', versionRange: '>=1.0.0' },
      { key: 'a', versionRange: '>=1.0.0' },
      { key: 'm', versionRange: '>=1.0.0' },
    ];
    const reordered = [...dependencies].reverse();
    expect(computeSignature('widget', '1.0.0', dependencies)).toBe(computeSignature('widget', '1.0.0', reordered));
  });

  it('listAllVersions() returns an empty array for an organization with nothing published', async () => {
    const { engine } = setup();
    expect(await engine.listAllVersions(ORG)).toEqual([]);
  });

  it('publishVersion() supports a version range dependency using any supported operator', async () => {
    const { engine } = setup();
    const packageVersion = await engine.publishVersion(ORG, {
      extensionKey: 'widget',
      version: '1.0.0',
      dependencies: [{ key: 'core', versionRange: '<=2.0.0' }],
    });
    expect(packageVersion.dependencies[0]?.versionRange).toBe('<=2.0.0');
  });

  it('publishVersion() rejects a duplicate even when dependencies differ between the two calls', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.0.0', dependencies: [] });
    await expect(
      engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.0.0', dependencies: [{ key: 'core', versionRange: '>=1.0.0' }] }),
    ).rejects.toBeInstanceOf(DuplicatePackageVersionError);
  });

  it('getVersion() returns null for an unknown id in a known organization', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.0.0' });
    expect(await engine.getVersion(ORG, 'not-a-real-id')).toBeNull();
  });

  it('publishVersion() for three sequential versions of the same extension are all independently listed', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.0.0' });
    await engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.1.0' });
    await engine.publishVersion(ORG, { extensionKey: 'widget', version: '1.2.0' });
    const versions = await engine.listVersionsForExtension(ORG, 'widget');
    expect(versions.map((v) => v.version).sort()).toEqual(['1.0.0', '1.1.0', '1.2.0']);
  });

  it('findDependents() finds a dependent regardless of how many other unrelated dependencies it also declares', async () => {
    const { engine } = setup();
    await engine.publishVersion(ORG, {
      extensionKey: 'widget',
      version: '1.0.0',
      dependencies: [
        { key: 'unrelated-a', versionRange: '>=1.0.0' },
        { key: 'core', versionRange: '>=1.0.0' },
        { key: 'unrelated-b', versionRange: '>=1.0.0' },
      ],
    });
    expect(await engine.findDependents(ORG, 'core')).toHaveLength(1);
  });
});
