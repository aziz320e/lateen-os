/** @module branch/types */
import type { Entity } from '../shared/entity.js';
import type { BranchId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type {
  Address,
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODate,
  TenantScoped,
  Timezone,
} from '../shared/primitives.js';

export type BranchStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type BranchType = 'headquarters' | 'branch' | 'subsidiary' | 'warehouse' | 'remote';

export interface Branch extends Entity<BranchId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly type: BranchType;
  readonly status: BranchStatus;
  readonly address?: Address;
  readonly phone?: string;
  readonly email?: string;
  readonly currency?: CurrencyCode;
  readonly timezone?: Timezone;
  readonly managerId?: EmployeeId;
  readonly openedAt?: ISODate;
}

export type { OrganizationId };
