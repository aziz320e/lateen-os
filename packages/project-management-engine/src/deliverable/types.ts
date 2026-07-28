/** @module deliverable/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { DeliverableId } from '../shared/identifiers.js';
import type { ISODate, ISODateTime } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';

export type { DeliverableId };

export type DeliverableStatus = 'draft' | 'in_review' | 'accepted' | 'rejected' | 'completed';

/** One acceptance approval recorded against a deliverable. */
export interface DeliverableApproval {
  /** Opaque foreign key — typically an HR Engine `EmployeeId`. */
  readonly approverId: string;
  readonly approvedAt: ISODateTime;
  readonly comment?: string;
}

/** A tangible or intangible output of a project, with acceptance status, approvals, and completion tracking. */
export interface Deliverable extends TenantAuditableEntity<DeliverableId> {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  readonly name: string;
  readonly description?: string;
  readonly dueDate?: ISODate;
  readonly approvals: readonly DeliverableApproval[];
  readonly status: DeliverableStatus;
  readonly currentVersion: number;
}
