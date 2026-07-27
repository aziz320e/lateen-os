/**
 * Real Workflow Governance service — approval, version policy, and
 * execution policy for workflow definitions. Optionally cross-checks a
 * real, injected Workflow Engine `WorkflowQueries.findRunningWorkflows`
 * to enforce `maxConcurrentInstances` against genuinely running
 * instances — degrades to an always-allowed check when not injected.
 *
 * @module workflow-governance/service.impl
 */
import { WorkflowGovernanceRecordNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, WorkflowGovernanceRecordId } from '../shared/identifiers.js';
import type { WorkflowGovernanceRecordRepository } from './repository.js';
import type { WorkflowGovernanceRecord, WorkflowGovernanceStatus } from './types.js';

/** Minimal slice of Workflow Engine's `WorkflowQueries` this module depends on. */
export interface WorkflowRuntimeQueriesPort {
  findRunningWorkflows(query: { readonly organizationId: string; readonly definitionId?: string }): Promise<{ readonly instances: readonly unknown[] }>;
}

export interface WorkflowGovernanceDeps {
  readonly workflow?: WorkflowRuntimeQueriesPort;
}

export interface RequestWorkflowApprovalInput {
  readonly workflowCode: string;
  readonly reason?: string;
}

export interface SetVersionPolicyInput {
  readonly allowedVersions?: readonly string[];
  readonly deniedVersions?: readonly string[];
}

export interface SetExecutionPolicyInput {
  readonly maxConcurrentInstances?: number;
}

export interface ExecutionPolicyCheck {
  readonly allowed: boolean;
  readonly runningCount: number;
  readonly reason?: string;
}

export interface WorkflowGovernanceService {
  requestApproval(organizationId: OrganizationId, input: RequestWorkflowApprovalInput): Promise<WorkflowGovernanceRecord>;
  approveWorkflow(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId): Promise<WorkflowGovernanceRecord>;
  rejectWorkflow(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId, reason?: string): Promise<WorkflowGovernanceRecord>;
  setVersionPolicy(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId, input: SetVersionPolicyInput): Promise<WorkflowGovernanceRecord>;
  setExecutionPolicy(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId, input: SetExecutionPolicyInput): Promise<WorkflowGovernanceRecord>;
  isVersionAllowed(record: WorkflowGovernanceRecord, version: string): boolean;
  checkExecutionPolicy(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId): Promise<ExecutionPolicyCheck>;
  get(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId): Promise<WorkflowGovernanceRecord | null>;
}

/** Pure deny-wins version check: an empty allow list means every version not explicitly denied is allowed. */
function isVersionAllowedPure(record: WorkflowGovernanceRecord, version: string): boolean {
  if (record.deniedVersions.includes(version)) return false;
  if (record.allowedVersions.length === 0) return true;
  return record.allowedVersions.includes(version);
}

/** Creates a real {@link WorkflowGovernanceService} backed by a {@link WorkflowGovernanceRecordRepository}. */
export function createWorkflowGovernanceService(
  repository: WorkflowGovernanceRecordRepository,
  deps: WorkflowGovernanceDeps = {},
  now: () => string = nowIso,
): WorkflowGovernanceService {
  async function requireRecord(organizationId: OrganizationId, recordId: WorkflowGovernanceRecordId): Promise<WorkflowGovernanceRecord> {
    const record = await repository.findById(organizationId, recordId);
    if (!record) throw new WorkflowGovernanceRecordNotFoundError(recordId);
    return record;
  }

  return {
    async requestApproval(organizationId, input) {
      const timestamp = now();
      const record: WorkflowGovernanceRecord = {
        id: generateId('workflow-governance-record'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        workflowCode: input.workflowCode,
        status: 'pending',
        allowedVersions: [],
        deniedVersions: [],
        reason: input.reason,
      };
      await repository.save(record);
      return record;
    },

    async approveWorkflow(organizationId, recordId) {
      const record = await requireRecord(organizationId, recordId);
      const updated: WorkflowGovernanceRecord = { ...record, status: 'approved' as WorkflowGovernanceStatus, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async rejectWorkflow(organizationId, recordId, reason) {
      const record = await requireRecord(organizationId, recordId);
      const updated: WorkflowGovernanceRecord = { ...record, status: 'rejected' as WorkflowGovernanceStatus, reason, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async setVersionPolicy(organizationId, recordId, input) {
      const record = await requireRecord(organizationId, recordId);
      const updated: WorkflowGovernanceRecord = {
        ...record,
        allowedVersions: input.allowedVersions ?? record.allowedVersions,
        deniedVersions: input.deniedVersions ?? record.deniedVersions,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async setExecutionPolicy(organizationId, recordId, input) {
      const record = await requireRecord(organizationId, recordId);
      const updated: WorkflowGovernanceRecord = { ...record, maxConcurrentInstances: input.maxConcurrentInstances, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    isVersionAllowed: isVersionAllowedPure,

    async checkExecutionPolicy(organizationId, recordId) {
      const record = await requireRecord(organizationId, recordId);
      if (record.maxConcurrentInstances === undefined) {
        return { allowed: true, runningCount: 0 };
      }
      if (!deps.workflow) {
        return { allowed: true, runningCount: 0, reason: 'workflow_engine_not_injected' };
      }
      const result = await deps.workflow.findRunningWorkflows({ organizationId });
      const runningCount = result.instances.length;
      const allowed = runningCount < record.maxConcurrentInstances;
      return { allowed, runningCount, reason: allowed ? undefined : 'max_concurrent_instances_exceeded' };
    },

    async get(organizationId, recordId) {
      return repository.findById(organizationId, recordId);
    },
  };
}
