/** @module quotation/repository */
import type { CustomerId, OrganizationId, QuotationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentNumber } from '../shared/primitives.js';
import type { Quotation, QuotationStatus } from './types.js';

export interface QuotationRepository extends Repository<Quotation, QuotationId> {
  findByNumber(organizationId: OrganizationId, number: DocumentNumber): Promise<Quotation | null>;
  findByCustomer(
    organizationId: OrganizationId,
    customerId: CustomerId,
  ): Promise<readonly Quotation[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: QuotationStatus,
  ): Promise<readonly Quotation[]>;
}
