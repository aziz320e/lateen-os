import { describe, expect, it } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createWorkflowRequestRepository } from '../src/workflow-integration/repository.impl.js';
import { createWorkflowIntegrationService } from '../src/workflow-integration/service.impl.js';
import { InvalidWorkflowRequestTransitionError, WorkflowRequestNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createWorkflowIntegrationService without a Workflow Engine collaborator', () => {
  function setup() {
    const repository = createWorkflowRequestRepository();
    const service = createWorkflowIntegrationService(repository, {});
    return { repository, service };
  }

  it('generateRequest() records a request with no workflow linkage', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'follow_up_reminder', conversationId: 'conversation-1' });
    expect(request.status).toBe('pending');
    expect(request.workflowDefinitionId).toBeUndefined();
    expect(request.workflowInstanceId).toBeUndefined();
  });

  it('supports all 4 deterministic request types', async () => {
    const { service } = setup();
    const types = ['approval_reminder', 'follow_up_reminder', 'overdue_notification', 'escalation_notification'] as const;
    for (const requestType of types) {
      const request = await service.generateRequest(ORG, { requestType });
      expect(request.requestType).toBe(requestType);
    }
  });

  it('completeRequest() records the approved outcome', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'approval_reminder' });
    const completed = await service.completeRequest(ORG, request.id, { approved: true });
    expect(completed.status).toBe('completed');
    expect(completed.approved).toBe(true);
    expect(completed.completedAt).toBeDefined();
  });

  it('completeRequest() rejects an already-completed request', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'overdue_notification' });
    await service.completeRequest(ORG, request.id);
    await expect(service.completeRequest(ORG, request.id)).rejects.toBeInstanceOf(InvalidWorkflowRequestTransitionError);
  });

  it('cancelRequest() cancels a pending request', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'escalation_notification' });
    const cancelled = await service.cancelRequest(ORG, request.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('cancelRequest() rejects an already-cancelled request', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'escalation_notification' });
    await service.cancelRequest(ORG, request.id);
    await expect(service.cancelRequest(ORG, request.id)).rejects.toBeInstanceOf(InvalidWorkflowRequestTransitionError);
  });

  it('throws WorkflowRequestNotFoundError for an unknown request', async () => {
    const { service } = setup();
    await expect(service.completeRequest(ORG, 'missing')).rejects.toBeInstanceOf(WorkflowRequestNotFoundError);
  });

  it('get() returns null for an unknown request', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByConversation() returns every request for a conversation', async () => {
    const { service } = setup();
    await service.generateRequest(ORG, { requestType: 'follow_up_reminder', conversationId: 'conversation-1' });
    await service.generateRequest(ORG, { requestType: 'overdue_notification', conversationId: 'conversation-1' });
    await service.generateRequest(ORG, { requestType: 'escalation_notification', conversationId: 'conversation-2' });

    const requests = await service.listByConversation(ORG, 'conversation-1');
    expect(requests).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'follow_up_reminder' });
    expect(await repository.findById('org-2', request.id)).toBeNull();
  });
});

describe('createWorkflowIntegrationService with a real Workflow Engine runtime', () => {
  function setup() {
    const workflow = createWorkflowRuntime();
    const repository = createWorkflowRequestRepository();
    const service = createWorkflowIntegrationService(repository, { workflow });
    return { workflow, repository, service };
  }

  it('generateRequest() defines and starts a real backing workflow instance', async () => {
    const { workflow, service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'approval_reminder', conversationId: 'conversation-1', notes: 'Please approve' });

    expect(request.workflowDefinitionId).toBeDefined();
    expect(request.workflowInstanceId).toBeDefined();

    const { instances } = await workflow.queries.findRunningWorkflows({ organizationId: ORG, definitionId: request.workflowDefinitionId! });
    const instance = instances.find((candidate) => candidate.id === request.workflowInstanceId);
    expect(instance).toBeDefined();
    expect(instance?.variables.conversationId).toBe('conversation-1');
    expect(instance?.variables.notes).toBe('Please approve');
  });

  it('generateRequest() reuses the same workflow definition for the same organization and request type', async () => {
    const { service } = setup();
    const first = await service.generateRequest(ORG, { requestType: 'overdue_notification' });
    const second = await service.generateRequest(ORG, { requestType: 'overdue_notification' });
    expect(second.workflowDefinitionId).toBe(first.workflowDefinitionId);
    expect(second.workflowInstanceId).not.toBe(first.workflowInstanceId);
  });

  it('generateRequest() defines separate workflow definitions per request type', async () => {
    const { service } = setup();
    const approval = await service.generateRequest(ORG, { requestType: 'approval_reminder' });
    const escalation = await service.generateRequest(ORG, { requestType: 'escalation_notification' });
    expect(approval.workflowDefinitionId).not.toBe(escalation.workflowDefinitionId);
  });

  it('generateRequest() defines separate workflow definitions per organization', async () => {
    const { service } = setup();
    const orgOne = await service.generateRequest(ORG, { requestType: 'follow_up_reminder' });
    const orgTwo = await service.generateRequest('org-2', { requestType: 'follow_up_reminder' });
    expect(orgOne.workflowDefinitionId).not.toBe(orgTwo.workflowDefinitionId);
  });
});
