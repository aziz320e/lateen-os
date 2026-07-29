/** @module package-registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PackageVersionId } from '../shared/identifiers.js';

export type { PackageVersionId };

export interface PackageDependency {
  readonly key: string;
  readonly versionRange: string;
}

/** One published, immutable version of an extension or plugin package. */
export interface PackageVersion extends TenantAuditableEntity<PackageVersionId> {
  readonly extensionKey: string;
  readonly version: string;
  readonly dependencies: readonly PackageDependency[];
  /** A real SHA-256 content-integrity digest over `(extensionKey, version, dependencies)` — computed at publish time, never supplied by the caller. */
  readonly signature: string;
  readonly publishedAt: string;
}
