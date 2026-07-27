/** Real, in-memory {@link QuoteRepository} and {@link QuoteVersionRepository} implementations. @module quote/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Quote, QuoteVersion } from './types.js';
import type { QuoteRepository, QuoteVersionRepository } from './repository.js';

/** Creates a real, in-memory {@link QuoteRepository}. */
export function createQuoteRepository(seed?: readonly Quote[]): QuoteRepository {
  const repo = createInMemoryRepository<Quote>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((quote) => quote.status === status);
    },
    async findByOpportunity(organizationId, opportunityId) {
      return repo.list(organizationId).filter((quote) => quote.opportunityId === opportunityId);
    },
  };
}

/** `QuoteVersion`'s natural key is `id`, but lookups are always scoped by `quoteId` too — a small hand-rolled Map store. */
export function createQuoteVersionRepository(seed?: readonly QuoteVersion[]): QuoteVersionRepository {
  const store = new Map<string, QuoteVersion>();
  for (const version of seed ?? []) store.set(version.id, version);

  return {
    async save(version) {
      store.set(version.id, version);
    },
    async findById(organizationId, versionId) {
      const version = store.get(versionId);
      if (!version || version.organizationId !== organizationId) return null;
      return version;
    },
    async findAllByQuote(organizationId, quoteId) {
      return [...store.values()]
        .filter((version) => version.organizationId === organizationId && version.quoteId === quoteId)
        .sort((a, b) => a.versionNumber - b.versionNumber);
    },
  };
}
