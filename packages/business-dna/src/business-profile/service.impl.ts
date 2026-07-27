/**
 * Real Business Profile service — a singleton-per-organization upsert over
 * company metadata, industry, legal entity, and market/product/service
 * references.
 *
 * @module business-profile/service.impl
 */
import type { BusinessDnaEventBus } from '../events/business-dna-event-bus.js';
import { nowIso } from '../shared/id.js';
import type { MarketId, OrganizationId, ProductId, ServiceId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { IndustryVertical } from '../organization/types.js';
import type { BusinessProfileRepository } from './repository.js';
import type { BusinessProfile, LegalEntity } from './types.js';

export interface UpsertBusinessProfileInput {
  readonly displayName: string;
  readonly description?: string;
  readonly website?: string;
  readonly logoUrl?: string;
  readonly foundedAt?: ISODate;
  readonly industries?: readonly IndustryVertical[];
  readonly legalEntity: LegalEntity;
  readonly marketIds?: readonly MarketId[];
  readonly productIds?: readonly ProductId[];
  readonly serviceIds?: readonly ServiceId[];
}

export interface BusinessProfileService {
  upsert(organizationId: OrganizationId, input: UpsertBusinessProfileInput): Promise<BusinessProfile>;
  get(organizationId: OrganizationId): Promise<BusinessProfile | null>;
}

/** Creates a real {@link BusinessProfileService} backed by a {@link BusinessProfileRepository}. */
export function createBusinessProfileService(
  repository: BusinessProfileRepository,
  eventBus?: BusinessDnaEventBus,
  now: () => string = nowIso,
): BusinessProfileService {
  return {
    async upsert(organizationId, input) {
      const existing = await repository.findByOrganization(organizationId);
      const timestamp = now();
      const profile: BusinessProfile = {
        id: organizationId,
        organizationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        displayName: input.displayName,
        description: input.description ?? existing?.description,
        website: input.website ?? existing?.website,
        logoUrl: input.logoUrl ?? existing?.logoUrl,
        foundedAt: input.foundedAt ?? existing?.foundedAt,
        industries: input.industries ?? existing?.industries ?? [],
        legalEntity: input.legalEntity,
        marketIds: input.marketIds ?? existing?.marketIds ?? [],
        productIds: input.productIds ?? existing?.productIds ?? [],
        serviceIds: input.serviceIds ?? existing?.serviceIds ?? [],
      };
      await repository.save(profile);
      eventBus?.publish('business-profile.updated', { organizationId });
      return profile;
    },

    async get(organizationId) {
      return repository.findByOrganization(organizationId);
    },
  };
}
