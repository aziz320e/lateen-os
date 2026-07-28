/** Real, in-memory Accounts Payable repositories. @module accounts-payable/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { APPaymentRepository, BillRepository, VendorCreditRepository, VendorRepository } from './repository.js';
import type { APPayment, Bill, Vendor, VendorCredit } from './types.js';

/** Creates a real, in-memory {@link VendorRepository}. */
export function createVendorRepository(seed?: readonly Vendor[]): VendorRepository {
  const repo = createInMemoryRepository<Vendor>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link BillRepository}. */
export function createBillRepository(seed?: readonly Bill[]): BillRepository {
  const repo = createInMemoryRepository<Bill>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByVendor(organizationId, vendorId) {
      return repo.list(organizationId).filter((bill) => bill.vendorId === vendorId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((bill) => bill.status === status);
    },
  };
}

/** Creates a real, in-memory {@link VendorCreditRepository}. */
export function createVendorCreditRepository(seed?: readonly VendorCredit[]): VendorCreditRepository {
  const repo = createInMemoryRepository<VendorCredit>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByVendor(organizationId, vendorId) {
      return repo.list(organizationId).filter((credit) => credit.vendorId === vendorId);
    },
  };
}

/** Creates a real, in-memory {@link APPaymentRepository}. */
export function createAPPaymentRepository(seed?: readonly APPayment[]): APPaymentRepository {
  const repo = createInMemoryRepository<APPayment>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByBill(organizationId, billId) {
      return repo.list(organizationId).filter((payment) => payment.billId === billId);
    },
  };
}
