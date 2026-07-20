/** @module service/types */
import type { Entity } from '../shared/entity.js';
import type {
  DepartmentId,
  OrganizationId,
  ServiceId,
  SupplierId,
} from '../shared/identifiers.js';
import type {
  Auditable,
  BusinessCode,
  CurrencyCode,
  TenantScoped,
} from '../shared/primitives.js';

export type ServiceStatus = 'draft' | 'active' | 'discontinued' | 'archived';
export type ServiceType =
  | 'consulting'
  | 'maintenance'
  | 'support'
  | 'implementation'
  | 'managed';
export type PricingModel = 'fixed' | 'hourly' | 'daily' | 'monthly' | 'outcome_based';

export interface Service extends Entity<ServiceId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: ServiceType;
  readonly status: ServiceStatus;
  readonly pricingModel: PricingModel;
  readonly basePrice?: string;
  readonly currency?: CurrencyCode;
  readonly estimatedDuration?: string;
  readonly departmentId?: DepartmentId;
  readonly supplierId?: SupplierId;
}

export type { OrganizationId };
