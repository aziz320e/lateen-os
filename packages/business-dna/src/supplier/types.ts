/** @module supplier/types */
import type { Entity } from '../shared/entity.js';
import type { OrganizationId, SupplierId } from '../shared/identifiers.js';
import type {
  Address,
  Auditable,
  BusinessCode,
  CurrencyCode,
  TenantScoped,
} from '../shared/primitives.js';

export type SupplierType =
  | 'manufacturer'
  | 'distributor'
  | 'service_provider'
  | 'contractor';
export type SupplierStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'archived';
export type SupplierRating = 'A' | 'B' | 'C' | 'D';

export interface Supplier extends Entity<SupplierId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly type: SupplierType;
  readonly status: SupplierStatus;
  readonly email?: string;
  readonly phone?: string;
  readonly address?: Address;
  readonly taxId?: string;
  readonly currency?: CurrencyCode;
  readonly paymentTerms?: string;
  readonly rating?: SupplierRating;
}

export type { OrganizationId };
