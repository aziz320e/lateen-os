/** Real in-memory {@link PriceAnalysisRepository} implementation. @module pricing-intelligence/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PriceAnalysisId } from '../shared/identifiers.js';
import type { PriceAnalysis } from './types.js';
import type { PriceAnalysisRepository } from './repository.js';

export function createPriceAnalysisRepository(seed?: readonly PriceAnalysis[]): PriceAnalysisRepository {
  const repo = createInMemoryRepository<PriceAnalysis, PriceAnalysisId>({ seed });
  return {
    ...repo,
    async findByProduct(organizationId, productId) {
      return repo.list(organizationId).filter((analysis) => analysis.productId === productId);
    },
  };
}
