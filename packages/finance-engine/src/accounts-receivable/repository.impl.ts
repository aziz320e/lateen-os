/** Real, in-memory Accounts Receivable repositories. @module accounts-receivable/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ARCustomerRepository, ARInvoiceRepository, ARPaymentRepository, CreditNoteRepository } from './repository.js';
import type { ARCustomer, ARInvoice, ARPayment, CreditNote } from './types.js';

/** Creates a real, in-memory {@link ARCustomerRepository}. */
export function createARCustomerRepository(seed?: readonly ARCustomer[]): ARCustomerRepository {
  const repo = createInMemoryRepository<ARCustomer>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link ARInvoiceRepository}. */
export function createARInvoiceRepository(seed?: readonly ARInvoice[]): ARInvoiceRepository {
  const repo = createInMemoryRepository<ARInvoice>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((invoice) => invoice.customerId === customerId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((invoice) => invoice.status === status);
    },
  };
}

/** Creates a real, in-memory {@link CreditNoteRepository}. */
export function createCreditNoteRepository(seed?: readonly CreditNote[]): CreditNoteRepository {
  const repo = createInMemoryRepository<CreditNote>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((note) => note.customerId === customerId);
    },
  };
}

/** Creates a real, in-memory {@link ARPaymentRepository}. */
export function createARPaymentRepository(seed?: readonly ARPayment[]): ARPaymentRepository {
  const repo = createInMemoryRepository<ARPayment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByInvoice(organizationId, invoiceId) {
      return repo.list(organizationId).filter((payment) => payment.invoiceId === invoiceId);
    },
  };
}
