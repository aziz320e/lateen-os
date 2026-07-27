import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createMessageRepository } from '../src/message/repository.impl.js';
import { createMessageLifecycle } from '../src/message/lifecycle.impl.js';
import { createChannelRegistry } from '../src/channel/index.js';
import { createTimelineService } from '../src/timeline/engine.impl.js';

const ORG = 'org-1';

describe('createTimelineService without collaborators', () => {
  it('builds a timeline from local messages only', async () => {
    const messageRepository = createMessageRepository();
    const messages = createMessageLifecycle(messageRepository, createChannelRegistry());
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'Hello' });

    const timeline = createTimelineService(messageRepository);
    const entries = await timeline.buildTimeline(ORG);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.source).toBe('message');
  });

  it('returns an empty timeline when nothing exists', async () => {
    const timeline = createTimelineService(createMessageRepository());
    expect(await timeline.buildTimeline(ORG)).toEqual([]);
  });
});

describe('createTimelineService with real CRM, Sales, Marketing, and Workflow runtimes', () => {
  async function setup() {
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const marketing = createMarketingRuntime();
    const workflow = createWorkflowRuntime();
    const messageRepository = createMessageRepository();
    const messages = createMessageLifecycle(messageRepository, createChannelRegistry());
    const timeline = createTimelineService(messageRepository, { crm, sales, marketing, workflow });
    return { crm, sales, marketing, workflow, messages, timeline };
  }

  it('combines real CRM Engine activities into the timeline', async () => {
    const { crm, timeline } = await setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    await crm.activities.log(ORG, { activityType: 'call', subject: 'Kickoff call', relatedTo: { entityType: 'customer', entityId: customer.id } });

    const entries = await timeline.buildTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'crm' && entry.label === 'Kickoff call')).toBe(true);
  });

  it('combines real Sales Engine activities into the timeline', async () => {
    const { sales, timeline } = await setup();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Acme — Deal' });
    await sales.activities.log(ORG, { activityType: 'meeting', subject: 'Deal review', relatedTo: { entityType: 'opportunity', entityId: opportunity.id } });

    const entries = await timeline.buildTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'sales' && entry.label === 'Deal review')).toBe(true);
  });

  it('combines real Marketing Engine leads into the timeline', async () => {
    const { marketing, timeline } = await setup();
    await marketing.leadGeneration.generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });

    const entries = await timeline.buildTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'marketing' && entry.label === 'Jordan Lee')).toBe(true);
  });

  it('combines real Workflow Engine instances into the timeline', async () => {
    const { workflow, timeline } = await setup();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.workflow',
      name: 'Test Workflow',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'step-1', name: 'Step 1', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const entries = await timeline.buildTimeline(ORG);
    expect(entries.some((entry) => entry.source === 'workflow')).toBe(true);
  });

  it('combines local messages alongside every real external source', async () => {
    const { crm, messages, timeline } = await setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    await crm.activities.log(ORG, { activityType: 'call', subject: 'Call', relatedTo: { entityType: 'customer', entityId: customer.id } });
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'Hi' });

    const entries = await timeline.buildTimeline(ORG);
    const sources = new Set(entries.map((entry) => entry.source));
    expect(sources.has('crm')).toBe(true);
    expect(sources.has('message')).toBe(true);
  });

  it('sorts entries most recent first', async () => {
    const { messages, timeline } = await setup();
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'First' });
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'Second' });

    const entries = await timeline.buildTimeline(ORG);
    for (let i = 1; i < entries.length; i += 1) {
      expect(entries[i - 1]!.occurredAt >= entries[i]!.occurredAt).toBe(true);
    }
  });

  it('respects an explicit limit', async () => {
    const { messages, timeline } = await setup();
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'A' });
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'B' });
    await messages.create(ORG, { conversationId: 'conversation-1', messageType: 'text', body: 'C' });

    const entries = await timeline.buildTimeline(ORG, 2);
    expect(entries).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { crm, timeline } = await setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    await crm.activities.log(ORG, { activityType: 'call', subject: 'Call', relatedTo: { entityType: 'customer', entityId: customer.id } });

    const entries = await timeline.buildTimeline('org-2');
    expect(entries).toEqual([]);
  });
});
