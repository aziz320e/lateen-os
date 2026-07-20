/** @module customer/types — Enrichment v1 */
import type { Entity } from '../shared/entity.js';
import type {
  AgentId,
  BranchId,
  CustomerId,
  EmployeeId,
  ProductId,
  RecurringScheduleId,
} from '../shared/identifiers.js';
import type { RegionCoverage, SlaTier } from '../shared/enums.js';
import type {
  Address,
  Auditable,
  BusinessCode,
  CurrencyCode,
  ISODate,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type CustomerType =
  | 'corporate'
  | 'government'
  | 'contractor'
  | 'agency'
  | 'retail_chain'
  | 'developer'
  | 'hospitality'
  | 'healthcare';

export type CustomerStatus =
  | 'prospect'
  | 'qualified'
  | 'active'
  | 'on_hold'
  | 'churned'
  | 'archived';

export type CustomerSegment = 'sme' | 'mid_market' | 'enterprise' | 'strategic';
export type AccountTier = 'standard' | 'priority' | 'enterprise' | 'strategic_partner';
export type ContractType =
  | 'spot'
  | 'framework'
  | 'annual'
  | 'multi_year'
  | 'master_service_agreement';
export type ContractStatus = 'none' | 'draft' | 'active' | 'expiring' | 'expired' | 'terminated';
export type { RegionCoverage };
export type HealthStatus = 'healthy' | 'at_risk' | 'critical';
export type ChurnRisk = 'low' | 'medium' | 'high';
export type RecurringFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'on_demand_trigger';
export type RecurringScheduleStatus = 'active' | 'paused' | 'cancelled';

/** Recurring order schedule value object on Customer aggregate. */
export interface RecurringOrderSchedule {
  readonly scheduleId: RecurringScheduleId;
  readonly productId: ProductId;
  readonly frequency: RecurringFrequency;
  readonly quantity: string;
  readonly deliveryBranchId?: BranchId;
  readonly autoGenerateOrder: boolean;
  readonly status: RecurringScheduleStatus;
}

/** B2B customer aggregate with enterprise contracts and recurring orders (Enrichment v1). */
export interface Customer extends Entity<CustomerId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly legalName?: string;
  readonly type: CustomerType;
  readonly status: CustomerStatus;
  readonly segment: CustomerSegment;
  readonly taxId?: string;
  readonly crNumber?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly billingAddress?: Address;
  readonly shippingAddress?: Address;
  readonly currency: CurrencyCode;
  readonly accountManagerId?: EmployeeId;
  readonly salesAiAgentId?: AgentId;
  readonly operationsAiAgentId?: AgentId;
  readonly accountTier?: AccountTier;
  readonly industryVertical?: string;
  readonly siteCount?: number;
  readonly regionCoverage?: readonly RegionCoverage[];
  readonly contractType?: ContractType;
  readonly contractStatus?: ContractStatus;
  readonly contractReference?: string;
  readonly contractStartDate?: ISODate;
  readonly contractEndDate?: ISODate;
  readonly contractValue?: string;
  readonly contractUtilizationPct?: string;
  readonly slaTier?: SlaTier;
  readonly slaResponseHours?: number;
  readonly slaDeliveryDays?: number;
  readonly paymentTerms?: string;
  readonly creditLimit?: string;
  readonly creditUsed?: string;
  readonly discountTierPct?: string;
  readonly priceListId?: string;
  readonly recurringOrderEnabled?: boolean;
  readonly recurringSchedules?: readonly RecurringOrderSchedule[];
  readonly nextRecurringOrderAt?: ISODateTime;
  readonly standingProducts?: readonly ProductId[];
  readonly healthScore?: string;
  readonly healthStatus?: HealthStatus;
  readonly lastOrderAt?: ISODateTime;
  readonly churnRisk?: ChurnRisk;
  readonly lifetimeValue?: string;
}
