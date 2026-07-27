import { describe, expect, it, vi } from 'vitest';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createWorkflowRequestRepository } from '../src/workflow-integration/repository.impl.js';
import { createWorkflowIntegrationService } from '../src/workflow-integration/service.impl.js';
import { createMarketingEventBus } from '../src/events/marketing-event-bus.js';
import { InvalidWorkflowRequestTransitionError, WorkflowRequestNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('createWorkflowIntegrationService without a Workflow Engine collaborator', () => {
  function setup(eventBus = createMarketingEventBus()) {
    const repository = createWorkflowRequestRepository();
    const service = createWorkflowIntegrationService(repository, {}, eventBus);
    return { repository, service, eventBus };
  }

  it('generateRequest() records a request with no workflow linkage', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1' });
    expect(request.status).toBe('pending');
    expect(request.workflowDefinitionId).toBeUndefined();
    expect(request.workflowInstanceId).toBeUndefined();
  });

  it('completeRequest() marks the request completed', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'follow_up', campaignId: 'campaign-1' });
    const completed = await service.completeRequest(ORG, request.id);
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).toBeDefined();
  });

  it('completeRequest() rejects an already-completed request', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'follow_up', campaignId: 'campaign-1' });
    await service.completeRequest(ORG, request.id);
    await expect(service.completeRequest(ORG, request.id)).rejects.toBeInstanceOf(InvalidWorkflowRequestTransitionError);
  });

  it('cancelRequest() marks the request cancelled', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'asset_review', campaignId: 'campaign-1' });
    const cancelled = await service.cancelRequest(ORG, request.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('cancelRequest() rejects an already-cancelled request', async () => {
    const { service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'asset_review', campaignId: 'campaign-1' });
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

  it('listByCampaign() returns every request for a campaign', async () => {
    const { service } = setup();
    await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1' });
    await service.generateRequest(ORG, { requestType: 'publishing', campaignId: 'campaign-1' });
    await service.generateRequest(ORG, { requestType: 'follow_up', campaignId: 'campaign-2' });

    const requests = await service.listByCampaign(ORG, 'campaign-1');
    expect(requests).toHaveLength(2);
  });

  it('publishes workflow.requested', async () => {
    const eventBus = createMarketingEventBus();
    const requested = vi.fn();
    eventBus.subscribe('workflow.requested', requested);
    const { service } = setup(eventBus);
    await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1' });
    await Promise.resolve();
    expect(requested).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1' });
    expect(await repository.findById('org-2', request.id)).toBeNull();
  });
});

describe('createWorkflowIntegrationService with a real Workflow Engine runtime', () => {
  function setup() {
    const workflow = createWorkflowRuntime();
    const repository = createWorkflowRequestRepository();
    const service = createWorkflowIntegrationService(repository, { workflow }, createMarketingEventBus());
    return { workflow, repository, service };
  }

  it('generateRequest() defines and starts a real backing workflow instance', async () => {
    const { workflow, service } = setup();
    const request = await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1', notes: 'Please review' });

    expect(request.workflowDefinitionId).toBeDefined();
    expect(request.workflowInstanceId).toBeDefined();

    const { instances } = await workflow.queries.findRunningWorkflows({ organizationId: ORG, definitionId: request.workflowDefinitionId! });
    const instance = instances.find((candidate) => candidate.id === request.workflowInstanceId);
    expect(instance).toBeDefined();
    expect(instance?.variables.campaignId).toBe('campaign-1');
    expect(instance?.variables.notes).toBe('Please review');
  });

  it('generateRequest() reuses the same workflow definition for the same organization and request type', async () => {
    const { service } = setup();
    const first = await service.generateRequest(ORG, { requestType: 'asset_review', campaignId: 'campaign-1' });
    const second = await service.generateRequest(ORG, { requestType: 'asset_review', campaignId: 'campaign-2' });

    expect(second.workflowDefinitionId).toBe(first.workflowDefinitionId);
    expect(second.workflowInstanceId).not.toBe(first.workflowInstanceId);
  });

  it('generateRequest() defines separate workflow definitions per request type', async () => {
    const { service } = setup();
    const approval = await service.generateRequest(ORG, { requestType: 'campaign_approval', campaignId: 'campaign-1' });
    const publishing = await service.generateRequest(ORG, { requestType: 'publishing', campaignId: 'campaign-1' });
    expect(approval.workflowDefinitionId).not.toBe(publishing.workflowDefinitionId);
  });

  it('generateRequest() defines separate workflow definitions per organization', async () => {
    const { service } = setup();
    const orgOne = await service.generateRequest(ORG, { requestType: 'follow_up', campaignId: 'campaign-1' });
    const orgTwo = await service.generateRequest('org-2', { requestType: 'follow_up', campaignId: 'campaign-1' });
    expect(orgOne.workflowDefinitionId).not.toBe(orgTwo.workflowDefinitionId);
  });
});
