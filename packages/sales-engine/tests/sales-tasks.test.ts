import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createSalesTaskRepository } from '../src/task/repository.impl.js';
import { createSalesTasksService } from '../src/task/service.impl.js';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';
import { InvalidSalesTaskTransitionError, SalesTaskNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createSalesTasksService without a Workflow Engine collaborator', () => {
  function setup(eventBus = createSalesEventBus()) {
    const repository = createSalesTaskRepository();
    const service = createSalesTasksService(repository, {}, eventBus);
    return { repository, service, eventBus };
  }

  it('generateTask() records a task with no workflow linkage', async () => {
    const { service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1' });
    expect(task.status).toBe('pending');
    expect(task.workflowDefinitionId).toBeUndefined();
    expect(task.workflowInstanceId).toBeUndefined();
  });

  it('completeTask() marks the task completed', async () => {
    const { service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    const completed = await service.completeTask(ORG, task.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('completeTask() with approved:true on a proposal_approval task publishes proposal.approved', async () => {
    const eventBus = createSalesEventBus();
    const approved = vi.fn();
    eventBus.subscribe('proposal.approved', approved);
    const { service } = setup(eventBus);

    const task = await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1' });
    await service.completeTask(ORG, task.id, { approved: true });
    await Promise.resolve();
    expect(approved).toHaveBeenCalledTimes(1);
  });

  it('completeTask() with approved:false does not publish proposal.approved', async () => {
    const eventBus = createSalesEventBus();
    const approved = vi.fn();
    eventBus.subscribe('proposal.approved', approved);
    const { service } = setup(eventBus);

    const task = await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1' });
    await service.completeTask(ORG, task.id, { approved: false });
    await Promise.resolve();
    expect(approved).not.toHaveBeenCalled();
  });

  it('completeTask() on a contract_review or follow_up_reminder task never publishes proposal.approved', async () => {
    const eventBus = createSalesEventBus();
    const approved = vi.fn();
    eventBus.subscribe('proposal.approved', approved);
    const { service } = setup(eventBus);

    const task = await service.generateTask(ORG, { taskType: 'contract_review', opportunityId: 'opp-1' });
    await service.completeTask(ORG, task.id, { approved: true });
    await Promise.resolve();
    expect(approved).not.toHaveBeenCalled();
  });

  it('completeTask() rejects an already-completed task', async () => {
    const { service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    await service.completeTask(ORG, task.id);
    await expect(service.completeTask(ORG, task.id)).rejects.toBeInstanceOf(InvalidSalesTaskTransitionError);
  });

  it('cancelTask() marks the task cancelled', async () => {
    const { service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    const cancelled = await service.cancelTask(ORG, task.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('cancelTask() rejects an already-cancelled task', async () => {
    const { service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    await service.cancelTask(ORG, task.id);
    await expect(service.cancelTask(ORG, task.id)).rejects.toBeInstanceOf(InvalidSalesTaskTransitionError);
  });

  it('throws SalesTaskNotFoundError for an unknown task', async () => {
    const { service } = setup();
    await expect(service.completeTask(ORG, 'missing')).rejects.toBeInstanceOf(SalesTaskNotFoundError);
  });

  it('get() returns null for an unknown task', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByOpportunity() returns every task for an opportunity', async () => {
    const { service } = setup();
    await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1' });
    await service.generateTask(ORG, { taskType: 'contract_review', opportunityId: 'opp-1' });
    await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-2' });

    const tasks = await service.listByOpportunity(ORG, 'opp-1');
    expect(tasks).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    expect(await repository.findById('org-2', task.id)).toBeNull();
  });
});

describe('createSalesTasksService with a real Workflow Engine runtime', () => {
  function setup() {
    const workflow = createWorkflowRuntime();
    const repository = createSalesTaskRepository();
    const service = createSalesTasksService(repository, { workflow }, createSalesEventBus());
    return { workflow, repository, service };
  }

  it('generateTask() defines and starts a real backing workflow instance', async () => {
    const { workflow, service } = setup();
    const task = await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1', notes: 'Please review' });

    expect(task.workflowDefinitionId).toBeDefined();
    expect(task.workflowInstanceId).toBeDefined();

    const { instances } = await workflow.queries.findRunningWorkflows({ organizationId: ORG, definitionId: task.workflowDefinitionId! });
    const instance = instances.find((candidate) => candidate.id === task.workflowInstanceId);
    expect(instance).toBeDefined();
    expect(instance?.definitionId).toBe(task.workflowDefinitionId);
    expect(instance?.variables.opportunityId).toBe('opp-1');
    expect(instance?.variables.notes).toBe('Please review');
  });

  it('generateTask() reuses the same workflow definition for the same organization and task type', async () => {
    const { service } = setup();
    const first = await service.generateTask(ORG, { taskType: 'contract_review', opportunityId: 'opp-1' });
    const second = await service.generateTask(ORG, { taskType: 'contract_review', opportunityId: 'opp-2' });

    expect(second.workflowDefinitionId).toBe(first.workflowDefinitionId);
    expect(second.workflowInstanceId).not.toBe(first.workflowInstanceId);
  });

  it('generateTask() defines separate workflow definitions per task type', async () => {
    const { service } = setup();
    const approval = await service.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: 'opp-1' });
    const review = await service.generateTask(ORG, { taskType: 'contract_review', opportunityId: 'opp-1' });
    expect(approval.workflowDefinitionId).not.toBe(review.workflowDefinitionId);
  });

  it('generateTask() defines separate workflow definitions per organization', async () => {
    const { service } = setup();
    const orgOneTask = await service.generateTask(ORG, { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    const orgTwoTask = await service.generateTask('org-2', { taskType: 'follow_up_reminder', opportunityId: 'opp-1' });
    expect(orgOneTask.workflowDefinitionId).not.toBe(orgTwoTask.workflowDefinitionId);
  });
});
