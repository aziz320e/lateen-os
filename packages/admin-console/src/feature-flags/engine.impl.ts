/**
 * Real Feature Flag Registry — organization-wide defaults, optionally
 * overridden at tenant or environment granularity, resolved by a
 * deterministic most-specific-match precedence.
 *
 * @module feature-flags/engine.impl
 */
import type { AdminEventBus } from '../events/admin-event-bus.js';
import { FeatureFlagNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EnvironmentId, FeatureFlagId, OrganizationId, TenantId } from '../shared/identifiers.js';
import type { FeatureFlagRepository } from './repository.js';
import type { FeatureFlag } from './types.js';

export interface RegisterFeatureFlagInput {
  readonly key: string;
  readonly description?: string;
  readonly tenantId?: TenantId;
  readonly environmentId?: EnvironmentId;
  readonly enabled?: boolean;
}

export interface FeatureFlagResolutionContext {
  readonly tenantId?: TenantId;
  readonly environmentId?: EnvironmentId;
}

export interface FeatureFlagEngine {
  registerFlag(organizationId: OrganizationId, input: RegisterFeatureFlagInput): Promise<FeatureFlag>;
  enableFlag(organizationId: OrganizationId, featureFlagId: FeatureFlagId): Promise<FeatureFlag>;
  disableFlag(organizationId: OrganizationId, featureFlagId: FeatureFlagId): Promise<FeatureFlag>;
  isEnabled(organizationId: OrganizationId, key: string, context?: FeatureFlagResolutionContext): Promise<boolean>;
  getFlag(organizationId: OrganizationId, featureFlagId: FeatureFlagId): Promise<FeatureFlag | null>;
  listFlags(organizationId: OrganizationId): Promise<readonly FeatureFlag[]>;
}

/** Creates a real {@link FeatureFlagEngine}. */
export function createFeatureFlagEngine(repository: FeatureFlagRepository, eventBus?: AdminEventBus, now: () => string = nowIso): FeatureFlagEngine {
  async function requireFlag(organizationId: OrganizationId, featureFlagId: FeatureFlagId): Promise<FeatureFlag> {
    const flag = await repository.findById(organizationId, featureFlagId);
    if (!flag) throw new FeatureFlagNotFoundError(featureFlagId);
    return flag;
  }

  return {
    async registerFlag(organizationId, input) {
      const timestamp = now();
      const flag: FeatureFlag = {
        id: generateId('admin-feature-flag'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        key: input.key,
        description: input.description,
        tenantId: input.tenantId,
        environmentId: input.environmentId,
        enabled: input.enabled ?? false,
      };
      await repository.save(flag);
      return flag;
    },

    async enableFlag(organizationId, featureFlagId) {
      const flag = await requireFlag(organizationId, featureFlagId);
      const updated: FeatureFlag = { ...flag, enabled: true, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('feature.enabled', { organizationId, featureFlagId, key: updated.key });
      return updated;
    },

    async disableFlag(organizationId, featureFlagId) {
      const flag = await requireFlag(organizationId, featureFlagId);
      const updated: FeatureFlag = { ...flag, enabled: false, updatedAt: now() };
      await repository.save(updated);
      eventBus?.publish('feature.disabled', { organizationId, featureFlagId, key: updated.key });
      return updated;
    },

    async isEnabled(organizationId, key, context) {
      const matches = await repository.findByKey(organizationId, key);

      if (context?.environmentId) {
        const environmentMatch = matches.find((flag) => flag.environmentId === context.environmentId && flag.tenantId === context.tenantId);
        if (environmentMatch) return environmentMatch.enabled;
      }

      if (context?.tenantId) {
        const tenantMatch = matches.find((flag) => flag.tenantId === context.tenantId && !flag.environmentId);
        if (tenantMatch) return tenantMatch.enabled;
      }

      const orgWideMatch = matches.find((flag) => !flag.tenantId && !flag.environmentId);
      return orgWideMatch?.enabled ?? false;
    },

    async getFlag(organizationId, featureFlagId) {
      return repository.findById(organizationId, featureFlagId);
    },

    async listFlags(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
