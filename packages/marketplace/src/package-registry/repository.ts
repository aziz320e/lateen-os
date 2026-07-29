/** @module package-registry/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PackageVersionId } from '../shared/identifiers.js';
import type { PackageVersion } from './types.js';

export interface PackageVersionRepository extends Repository<PackageVersion, PackageVersionId> {
  findAll(organizationId: OrganizationId): Promise<readonly PackageVersion[]>;
  findByExtensionKey(organizationId: OrganizationId, extensionKey: string): Promise<readonly PackageVersion[]>;
  findByExtensionKeyAndVersion(organizationId: OrganizationId, extensionKey: string, version: string): Promise<PackageVersion | null>;
}
