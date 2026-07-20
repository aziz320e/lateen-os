/** @module workflow/types */
import type { Entity } from '../shared/entity.js';
import type {
  AgentId,
  DepartmentId,
  MachineId,
  WorkflowId,
  WorkflowStageId,
} from '../shared/identifiers.js';
import type { RoleId } from '../role/types.js';
import type { Auditable, BusinessCode, TenantScoped } from '../shared/primitives.js';

export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type WorkflowType =
  | 'approval'
  | 'fulfillment'
  | 'onboarding'
  | 'procurement'
  | 'custom';

/** Stage within a Workflow aggregate. */
export interface WorkflowStage {
  readonly stageId: WorkflowStageId;
  readonly name: string;
  readonly order: number;
  readonly requiredRoleId?: RoleId;
  readonly requiredAgentId?: AgentId;
  readonly machineId?: MachineId;
  readonly autoAdvance?: boolean;
}

export interface Workflow extends Entity<WorkflowId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly type: WorkflowType;
  readonly status: WorkflowStatus;
  readonly entityType?: string;
  readonly departmentId?: DepartmentId;
  readonly version: number;
  readonly stages: readonly WorkflowStage[];
}
