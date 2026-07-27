/** @module business-profile/types */
import type { Entity } from '../shared/entity.js';
import type {
  BusinessProfileId,
  MarketId,
  OrganizationId,
  ProductId,
  ServiceId,
} from '../shared/identifiers.js';
import type { Auditable, ISODate, TenantScoped } from '../shared/primitives.js';
import type { IndustryVertical } from '../organization/types.js';

export type { BusinessProfileId };

export type LegalEntityType = 'llc' | 'corporation' | 'partnership' | 'sole_proprietorship' | 'branch' | 'other';

/** Legal registration details for the organization. */
export interface LegalEntity {
  readonly legalName: string;
  readonly entityType: LegalEntityType;
  readonly registrationNumber: string;
  readonly taxId: string;
  readonly countryOfIncorporation: string;
}

/**
 * Business Profile — a singleton per organization holding company metadata,
 * industry classification, legal entity details, and references to the
 * markets, products, and services the business operates.
 */
export interface BusinessProfile extends Entity<BusinessProfileId>, TenantScoped, Auditable {
  readonly displayName: string;
  readonly description?: string;
  readonly website?: string;
  readonly logoUrl?: string;
  readonly foundedAt?: ISODate;
  readonly industries: readonly IndustryVertical[];
  readonly legalEntity: LegalEntity;
  readonly marketIds: readonly MarketId[];
  readonly productIds: readonly ProductId[];
  readonly serviceIds: readonly ServiceId[];
}

export type { OrganizationId };
