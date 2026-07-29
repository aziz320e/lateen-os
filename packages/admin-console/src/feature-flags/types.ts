/** @module feature-flags/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EnvironmentId, FeatureFlagId, TenantId } from '../shared/identifiers.js';

export type { FeatureFlagId };

/**
 * A feature flag, optionally overridden at tenant or environment
 * granularity. A flag with neither `tenantId` nor `environmentId` is
 * the organization-wide default for its `key`.
 */
export interface FeatureFlag extends TenantAuditableEntity<FeatureFlagId> {
  readonly key: string;
  readonly description?: string;
  readonly tenantId?: TenantId;
  readonly environmentId?: EnvironmentId;
  readonly enabled: boolean;
}
