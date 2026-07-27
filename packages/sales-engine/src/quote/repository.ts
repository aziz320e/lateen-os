/** @module quote/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, QuoteId, QuoteVersionId, SalesOpportunityId } from '../shared/identifiers.js';
import type { Quote, QuoteStatus, QuoteVersion } from './types.js';

export interface QuoteRepository extends Repository<Quote, QuoteId> {
  findAll(organizationId: OrganizationId): Promise<readonly Quote[]>;
  findByStatus(organizationId: OrganizationId, status: QuoteStatus): Promise<readonly Quote[]>;
  findByOpportunity(organizationId: OrganizationId, opportunityId: SalesOpportunityId): Promise<readonly Quote[]>;
}

export interface QuoteVersionRepository {
  save(version: QuoteVersion): Promise<void>;
  findById(organizationId: OrganizationId, versionId: QuoteVersionId): Promise<QuoteVersion | null>;
  /** Every version for a quote, ordered oldest first. */
  findAllByQuote(organizationId: OrganizationId, quoteId: QuoteId): Promise<readonly QuoteVersion[]>;
}
