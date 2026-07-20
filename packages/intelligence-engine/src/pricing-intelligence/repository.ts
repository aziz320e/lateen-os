/** @module pricing-intelligence/repository */
import type { OrganizationId, PriceAnalysisId, ProductId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { PriceAnalysis } from './types.js';

export interface PriceAnalysisRepository extends Repository<PriceAnalysis, PriceAnalysisId> {
  findByProduct(
    organizationId: OrganizationId,
    productId: ProductId,
  ): Promise<readonly PriceAnalysis[]>;
}
