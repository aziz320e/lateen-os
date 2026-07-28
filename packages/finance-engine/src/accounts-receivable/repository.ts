/** @module accounts-receivable/repository */
import type { Repository } from '../shared/repository.js';
import type { ARCustomerId, ARInvoiceId, ARPaymentId, CreditNoteId, OrganizationId } from '../shared/identifiers.js';
import type { ARCustomer, ARInvoice, ARInvoiceStatus, ARPayment, CreditNote } from './types.js';

export interface ARCustomerRepository extends Repository<ARCustomer, ARCustomerId> {
  findAll(organizationId: OrganizationId): Promise<readonly ARCustomer[]>;
}

export interface ARInvoiceRepository extends Repository<ARInvoice, ARInvoiceId> {
  findAll(organizationId: OrganizationId): Promise<readonly ARInvoice[]>;
  findByCustomer(organizationId: OrganizationId, customerId: ARCustomerId): Promise<readonly ARInvoice[]>;
  findByStatus(organizationId: OrganizationId, status: ARInvoiceStatus): Promise<readonly ARInvoice[]>;
}

export interface CreditNoteRepository extends Repository<CreditNote, CreditNoteId> {
  findAll(organizationId: OrganizationId): Promise<readonly CreditNote[]>;
  findByCustomer(organizationId: OrganizationId, customerId: ARCustomerId): Promise<readonly CreditNote[]>;
}

export interface ARPaymentRepository extends Repository<ARPayment, ARPaymentId> {
  findAll(organizationId: OrganizationId): Promise<readonly ARPayment[]>;
  findByInvoice(organizationId: OrganizationId, invoiceId: ARInvoiceId): Promise<readonly ARPayment[]>;
}
