/** @module snapshot/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ObservabilitySnapshotId } from '../shared/identifiers.js';

export type { ObservabilitySnapshotId };

/** The five deterministic snapshot categories supported by the Snapshot Engine. */
export type ObservabilitySnapshotCategory = 'runtime' | 'workflows' | 'communications' | 'analytics' | 'security';

/** A single, deterministic snapshot of one integrated category. */
export interface ObservabilitySnapshot extends TenantAuditableEntity<ObservabilitySnapshotId> {
  readonly category: ObservabilitySnapshotCategory;
  readonly data: Readonly<Record<string, unknown>>;
  readonly computedAt: string;
}
