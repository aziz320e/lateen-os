/** @module asset/types */
import type { Entity } from '../shared/entity.js';
import type {
  AssetId,
  BranchId,
  DepartmentId,
  EmployeeId,
  OrganizationId,
  ProductId,
  ProjectId,
  SupplierId,
} from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODate,
  TenantScoped,
} from '../shared/primitives.js';

export type AssetStatus =
  | 'draft'
  | 'active'
  | 'in_use'
  | 'maintenance'
  | 'retired'
  | 'disposed'
  | 'archived';
export type AssetType =
  | 'physical'
  | 'digital'
  | 'vehicle'
  | 'equipment'
  | 'property'
  | 'intellectual';

export interface Asset extends Entity<AssetId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: AssetType;
  readonly status: AssetStatus;
  readonly category?: string;
  readonly serialNumber?: string;
  readonly purchasePrice?: string;
  readonly currentValue?: string;
  readonly currency?: CurrencyCode;
  readonly branchId?: BranchId;
  readonly departmentId?: DepartmentId;
  readonly assignedToId?: EmployeeId;
  readonly supplierId?: SupplierId;
  readonly productId?: ProductId;
  readonly projectId?: ProjectId;
  readonly acquiredAt?: ISODate;
  readonly retiredAt?: ISODate;
}

export type { OrganizationId };
