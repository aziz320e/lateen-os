/** @module invoice/repository */
import type { CustomerId, InvoiceId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DocumentNumber } from '../shared/primitives.js';
import type { Invoice, InvoiceStatus } from './types.js';

export interface InvoiceRepository extends Repository<Invoice, InvoiceId> {
  findByNumber(organizationId: OrganizationId, number: DocumentNumber): Promise<Invoice | null>;
  findByCustomer(
    organizationId: OrganizationId,
    customerId: CustomerId,
  ): Promise<readonly Invoice[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: InvoiceStatus,
  ): Promise<readonly Invoice[]>;
}
