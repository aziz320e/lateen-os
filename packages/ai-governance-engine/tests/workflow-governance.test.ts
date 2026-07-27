import { describe, expect, it } from 'vitest';
import { createWorkflowGovernanceRecordRepository } from '../src/workflow-governance/repository.impl.js';
import { createWorkflowGovernanceService, type WorkflowRuntimeQueriesPort } from '../src/workflow-governance/service.impl.js';
import { WorkflowGovernanceRecordNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(workflow?: WorkflowRuntimeQueriesPort) {
  const repository = createWorkflowGovernanceRecordRepository();
  const service = createWorkflowGovernanceService(repository, { workflow });
  return { repository, service };
}

describe('createWorkflowGovernanceService — approval lifecycle', () => {
  it('requestApproval() creates a pending record', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'sales.proposal' });
    expect(record.status).toBe('pending');
  });

  it('approveWorkflow() transitions to approved', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'sales.proposal' });
    const approved = await service.approveWorkflow(ORG, record.id);
    expect(approved.status).toBe('approved');
  });

  it('rejectWorkflow() transitions to rejected with a reason', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'sales.proposal' });
    const rejected = await service.rejectWorkflow(ORG, record.id, 'insufficient testing');
    expect(rejected.status).toBe('rejected');
    expect(rejected.reason).toBe('insufficient testing');
  });

  it('throws WorkflowGovernanceRecordNotFoundError for an unknown record', async () => {
    const { service } = setup();
    await expect(service.approveWorkflow(ORG, 'missing')).rejects.toBeInstanceOf(WorkflowGovernanceRecordNotFoundError);
  });
});

describe('createWorkflowGovernanceService — version policy (pure isVersionAllowed)', () => {
  it('an empty allow list means every non-denied version is allowed', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    expect(service.isVersionAllowed(record, '1.0.0')).toBe(true);
  });

  it('a non-empty allow list restricts to only listed versions', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    const updated = await service.setVersionPolicy(ORG, record.id, { allowedVersions: ['1.0.0'] });
    expect(service.isVersionAllowed(updated, '1.0.0')).toBe(true);
    expect(service.isVersionAllowed(updated, '2.0.0')).toBe(false);
  });

  it('deny always wins over allow', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    const updated = await service.setVersionPolicy(ORG, record.id, { allowedVersions: ['1.0.0'], deniedVersions: ['1.0.0'] });
    expect(service.isVersionAllowed(updated, '1.0.0')).toBe(false);
  });
});

describe('createWorkflowGovernanceService — execution policy', () => {
  it('allows unconditionally when no maxConcurrentInstances is set', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    const result = await service.checkExecutionPolicy(ORG, record.id);
    expect(result.allowed).toBe(true);
  });

  it('allows but flags when a limit is set without Workflow Engine injected', async () => {
    const { service } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    await service.setExecutionPolicy(ORG, record.id, { maxConcurrentInstances: 5 });
    const result = await service.checkExecutionPolicy(ORG, record.id);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('workflow_engine_not_injected');
  });

  it('denies when real running instance count reaches the limit', async () => {
    const workflow: WorkflowRuntimeQueriesPort = {
      async findRunningWorkflows() {
        return { instances: [{}, {}, {}] };
      },
    };
    const { service } = setup(workflow);
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    await service.setExecutionPolicy(ORG, record.id, { maxConcurrentInstances: 3 });
    const result = await service.checkExecutionPolicy(ORG, record.id);
    expect(result.allowed).toBe(false);
    expect(result.runningCount).toBe(3);
    expect(result.reason).toBe('max_concurrent_instances_exceeded');
  });

  it('allows when real running instance count is below the limit', async () => {
    const workflow: WorkflowRuntimeQueriesPort = {
      async findRunningWorkflows() {
        return { instances: [{}] };
      },
    };
    const { service } = setup(workflow);
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    await service.setExecutionPolicy(ORG, record.id, { maxConcurrentInstances: 3 });
    const result = await service.checkExecutionPolicy(ORG, record.id);
    expect(result.allowed).toBe(true);
    expect(result.runningCount).toBe(1);
  });
});

describe('createWorkflowGovernanceService — get / org scoping', () => {
  it('get() returns null for an unknown record', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { service, repository } = setup();
    const record = await service.requestApproval(ORG, { workflowCode: 'wf' });
    expect(await repository.findById('org-2', record.id)).toBeNull();
  });
});
