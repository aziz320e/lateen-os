/** @module agent/types — AI Agent (Layer 4 AI Workforce) */
import type { Entity } from '../shared/entity.js';
import type {
  AgentId,
  DepartmentId,
  EmployeeId,
  IdentityId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { PermissionId } from '../permission/types.js';
import type { RoleId } from '../role/types.js';
import type {
  Auditable,
  BusinessCode,
  ISODateTime,
  TenantScoped,
} from '../shared/primitives.js';

export type AgentStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'suspended'
  | 'decommissioned'
  | 'archived';

/** Maps to domains/ai-workforce agent roles. */
export type WorkforceType =
  | 'ceo_ai'
  | 'marketing_ai'
  | 'sales_ai'
  | 'operations_ai'
  | 'finance_ai'
  | 'product_manager_ai'
  | 'hr_ai'
  | 'rd_ai';

/**
 * AI Agent aggregate — registered AI worker in Business DNA.
 * Operates in Reactive and Proactive modes per Architecture v1.0.
 */
export interface Agent extends Entity<AgentId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly workforceType: WorkforceType;
  readonly status: AgentStatus;
  readonly departmentId?: DepartmentId;
  readonly supervisorId?: EmployeeId;
  readonly delegatedEmployeeId?: EmployeeId;
  readonly proactiveEnabled: boolean;
  readonly reactiveEnabled: boolean;
  readonly lastProactiveRunAt?: ISODateTime;
  readonly identityId?: IdentityId;
  readonly roleIds?: readonly RoleId[];
  readonly permissionIds?: readonly PermissionId[];
}

export type { OrganizationId };
