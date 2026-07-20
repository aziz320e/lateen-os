/** @module shared/primitives */
import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { OrganizationId } from './identifiers.js';

export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

export type { Timestamp };

/** Semantic version string (e.g. 1.0.0). */
export type SemanticVersion = string;

/** Opaque service endpoint reference — resolved at runtime, not stored here. */
export type ServiceReference = string;

/** Event subject pattern for EventTrigger (e.g. lateen.discovery.*). */
export type EventSubjectPattern = string;
