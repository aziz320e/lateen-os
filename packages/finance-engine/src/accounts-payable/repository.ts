/** @module accounts-payable/repository */
import type { Repository } from '../shared/repository.js';
import type { APPaymentId, BillId, OrganizationId, VendorCreditId, VendorId } from '../shared/identifiers.js';
import type { APPayment, Bill, BillStatus, Vendor, VendorCredit } from './types.js';

export interface VendorRepository extends Repository<Vendor, VendorId> {
  findAll(organizationId: OrganizationId): Promise<readonly Vendor[]>;
}

export interface BillRepository extends Repository<Bill, BillId> {
  findAll(organizationId: OrganizationId): Promise<readonly Bill[]>;
  findByVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<readonly Bill[]>;
  findByStatus(organizationId: OrganizationId, status: BillStatus): Promise<readonly Bill[]>;
}

export interface VendorCreditRepository extends Repository<VendorCredit, VendorCreditId> {
  findAll(organizationId: OrganizationId): Promise<readonly VendorCredit[]>;
  findByVendor(organizationId: OrganizationId, vendorId: VendorId): Promise<readonly VendorCredit[]>;
}

export interface APPaymentRepository extends Repository<APPayment, APPaymentId> {
  findAll(organizationId: OrganizationId): Promise<readonly APPayment[]>;
  findByBill(organizationId: OrganizationId, billId: BillId): Promise<readonly APPayment[]>;
}
