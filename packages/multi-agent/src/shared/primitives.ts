/** @module shared/primitives */
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { OrganizationId } from './identifiers.js';

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

export type { Timestamp };

/** Canonical AI worker roles in multi-agent missions. */
export type MissionWorkerRole =
  | 'ceo_ai'
  | 'product_manager_ai'
  | 'marketing_ai'
  | 'sales_ai'
  | 'operations_ai'
  | 'finance_ai'
  | 'hr_ai';

/** Confidence or agreement score as decimal string. */
export type ScoreValue = string;
