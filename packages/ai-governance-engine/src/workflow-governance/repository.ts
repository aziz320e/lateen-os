/** @module workflow-governance/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkflowGovernanceRecordId } from '../shared/identifiers.js';
import type { WorkflowGovernanceRecord, WorkflowGovernanceStatus } from './types.js';

export interface WorkflowGovernanceRecordRepository extends Repository<WorkflowGovernanceRecord, WorkflowGovernanceRecordId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkflowGovernanceRecord[]>;
  findByWorkflowCode(organizationId: OrganizationId, workflowCode: string): Promise<WorkflowGovernanceRecord | null>;
  findByStatus(organizationId: OrganizationId, status: WorkflowGovernanceStatus): Promise<readonly WorkflowGovernanceRecord[]>;
}
