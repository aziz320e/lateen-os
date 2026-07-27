/** Real, in-memory {@link ProductRepository} / {@link ProductBundleRepository} implementations. @module product/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Product, ProductBundle } from './types.js';
import type { ProductBundleRepository, ProductRepository } from './repository.js';

/** Creates a real, in-memory {@link ProductRepository}. */
export function createProductRepository(seed?: readonly Product[]): ProductRepository {
  const repo = createInMemoryRepository<Product>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((product) => product.code === code) ?? null;
    },
    async findByCategory(organizationId, category) {
      return repo.list(organizationId).filter((product) => product.category === category);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((product) => product.status === status);
    },
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link ProductBundleRepository}. */
export function createProductBundleRepository(seed?: readonly ProductBundle[]): ProductBundleRepository {
  const repo = createInMemoryRepository<ProductBundle>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((bundle) => bundle.code === code) ?? null;
    },
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
