/** @module history/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkflowInstanceId } from '../shared/identifiers.js';
import type {
  AuditTrail,
  AuditTrailId,
  ExecutionHistory,
  ExecutionHistoryId,
  WorkflowHistory,
  WorkflowHistoryId,
} from './types.js';

export interface WorkflowHistoryRepository extends Repository<WorkflowHistory, WorkflowHistoryId> {
  findByInstance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<readonly WorkflowHistory[]>;
}
export interface ExecutionHistoryRepository extends Repository<ExecutionHistory, ExecutionHistoryId> {
  findByInstance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<readonly ExecutionHistory[]>;
}
export interface AuditTrailRepository extends Repository<AuditTrail, AuditTrailId> {
  findByInstance(organizationId: OrganizationId, instanceId: WorkflowInstanceId): Promise<readonly AuditTrail[]>;
}
