/** @module shared/primitives */
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

export interface TenantScoped {
  readonly organizationId: OrganizationId;
}
