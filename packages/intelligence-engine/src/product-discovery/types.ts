/** @module product-discovery/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  OrganizationId,
  ProductId,
  ProductIdeaId,
  ProductOpportunityId,
} from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { ProductOpportunityId, ProductIdeaId };

export type ProductOpportunityStatus = 'identified' | 'evaluating' | 'approved' | 'rejected' | 'archived';

export interface RequiredCapability {
  readonly capabilityId: CapabilityId;
  readonly label?: string;
  readonly available: boolean;
}

export interface ProductScore {
  readonly demand: ScoreValue;
  readonly profit: ScoreValue;
  readonly complexity: ScoreValue;
  readonly overall: ScoreValue;
}

export interface ProductIdea {
  readonly ideaId: ProductIdeaId;
  readonly title: string;
  readonly description?: string;
  readonly targetSegment?: string;
}

/** Intelligence-identified product opportunity. */
export interface ProductOpportunity extends TenantAuditableEntity<ProductOpportunityId> {
  readonly title: string;
  readonly description?: string;
  readonly ideas: readonly ProductIdea[];
  readonly score: ProductScore;
  readonly requiredCapabilities: readonly RequiredCapability[];
  readonly relatedProductId?: ProductId;
  readonly status: ProductOpportunityStatus;
}

export type { OrganizationId };
