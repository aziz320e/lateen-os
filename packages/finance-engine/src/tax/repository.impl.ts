/** Real, in-memory Tax Engine repositories. @module tax/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { TaxCalculationRepository, TaxRuleRepository } from './repository.js';
import type { TaxCalculation, TaxRule } from './types.js';

/** Creates a real, in-memory {@link TaxRuleRepository}. */
export function createTaxRuleRepository(seed?: readonly TaxRule[]): TaxRuleRepository {
  const repo = createInMemoryRepository<TaxRule>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, taxType) {
      return repo.list(organizationId).filter((rule) => rule.taxType === taxType);
    },
  };
}

/** Creates a real, in-memory {@link TaxCalculationRepository}. */
export function createTaxCalculationRepository(seed?: readonly TaxCalculation[]): TaxCalculationRepository {
  const repo = createInMemoryRepository<TaxCalculation>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByRule(organizationId, taxRuleId) {
      return repo.list(organizationId).filter((calculation) => calculation.taxRuleId === taxRuleId);
    },
  };
}
