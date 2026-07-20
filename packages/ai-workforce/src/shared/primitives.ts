/** @module shared/primitives */
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { OrganizationId } from './identifiers.js';

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

export type { Timestamp };

/** Score value as decimal string (0.00–1.00 or percentage). */
export type ScoreValue = string;

/** Workforce type — aligns with Business DNA and AI Runtime. */
export type WorkforceType =
  | 'ceo_ai'
  | 'marketing_ai'
  | 'sales_ai'
  | 'operations_ai'
  | 'finance_ai'
  | 'product_manager_ai'
  | 'hr_ai'
  | 'rd_ai';
