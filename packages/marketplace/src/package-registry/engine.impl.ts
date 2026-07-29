/**
 * Real Package Registry — versions, dependencies, and a real
 * content-integrity signature (SHA-256 over the canonical package
 * content, via Node's built-in `crypto` module — no external
 * cryptographic-signing library, no dependency added).
 *
 * @module package-registry/engine.impl
 */
import { createHash } from 'node:crypto';
import { DuplicatePackageVersionError, PackageVersionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PackageVersionId } from '../shared/identifiers.js';
import type { PackageVersionRepository } from './repository.js';
import type { PackageDependency, PackageVersion } from './types.js';

/** A real SHA-256 digest over the canonical `(extensionKey, version, dependencies)` content. */
export function computeSignature(extensionKey: string, version: string, dependencies: readonly PackageDependency[]): string {
  const canonical = JSON.stringify({ extensionKey, version, dependencies: [...dependencies].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)) });
  return createHash('sha256').update(canonical).digest('hex');
}

export interface PublishVersionInput {
  readonly extensionKey: string;
  readonly version: string;
  readonly dependencies?: readonly PackageDependency[];
}

export interface PackageRegistryEngine {
  publishVersion(organizationId: OrganizationId, input: PublishVersionInput): Promise<PackageVersion>;
  verifySignature(organizationId: OrganizationId, packageVersionId: PackageVersionId, providedSignature: string): Promise<boolean>;
  getVersion(organizationId: OrganizationId, packageVersionId: PackageVersionId): Promise<PackageVersion | null>;
  findVersion(organizationId: OrganizationId, extensionKey: string, version: string): Promise<PackageVersion | null>;
  listVersionsForExtension(organizationId: OrganizationId, extensionKey: string): Promise<readonly PackageVersion[]>;
  findDependents(organizationId: OrganizationId, key: string): Promise<readonly PackageVersion[]>;
  listAllVersions(organizationId: OrganizationId): Promise<readonly PackageVersion[]>;
}

/** Creates a real {@link PackageRegistryEngine}. */
export function createPackageRegistryEngine(repository: PackageVersionRepository, now: () => string = nowIso): PackageRegistryEngine {
  return {
    async publishVersion(organizationId, input) {
      const existing = await repository.findByExtensionKeyAndVersion(organizationId, input.extensionKey, input.version);
      if (existing) throw new DuplicatePackageVersionError(input.extensionKey, input.version);

      const dependencies = input.dependencies ?? [];
      const timestamp = now();
      const packageVersion: PackageVersion = {
        id: generateId('marketplace-package'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        extensionKey: input.extensionKey,
        version: input.version,
        dependencies,
        signature: computeSignature(input.extensionKey, input.version, dependencies),
        publishedAt: timestamp,
      };
      await repository.save(packageVersion);
      return packageVersion;
    },

    async verifySignature(organizationId, packageVersionId, providedSignature) {
      const packageVersion = await repository.findById(organizationId, packageVersionId);
      if (!packageVersion) throw new PackageVersionNotFoundError(packageVersionId);
      return packageVersion.signature === providedSignature;
    },

    async getVersion(organizationId, packageVersionId) {
      return repository.findById(organizationId, packageVersionId);
    },

    async findVersion(organizationId, extensionKey, version) {
      return repository.findByExtensionKeyAndVersion(organizationId, extensionKey, version);
    },

    async listVersionsForExtension(organizationId, extensionKey) {
      return repository.findByExtensionKey(organizationId, extensionKey);
    },

    async findDependents(organizationId, key) {
      const all = await repository.findAll(organizationId);
      return all.filter((version) => version.dependencies.some((dependency) => dependency.key === key));
    },

    async listAllVersions(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
