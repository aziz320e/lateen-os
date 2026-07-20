/** @module registry/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  WorkerId,
  WorkerRegistrationId,
} from '../shared/identifiers.js';
import type { WorkforceType } from '../shared/primitives.js';

export type { WorkerRegistrationId };

export type WorkerRegistrationStatus =
  | 'pending'
  | 'approved'
  | 'active'
  | 'suspended'
  | 'revoked';

/** Lightweight descriptor for worker discovery. */
export interface WorkerDescriptor {
  readonly workerId: WorkerId;
  readonly displayName: string;
  readonly workforceType: WorkforceType;
  readonly status: string;
  readonly departmentId?: string;
}

/** Registration request linking Business DNA agent to workforce. */
export interface WorkerRegistration extends TenantAuditableEntity<WorkerRegistrationId> {
  readonly workerId: WorkerId;
  readonly workforceType: WorkforceType;
  readonly status: WorkerRegistrationStatus;
  readonly registeredBy?: string;
  readonly approvedAt?: string;
}

/** Registry of all workforce workers in an organization. */
export interface WorkerRegistry {
  readonly organizationId: OrganizationId;
  readonly workerIds: readonly WorkerId[];
  readonly updatedAt: string;
}

export type { OrganizationId, WorkerId };
