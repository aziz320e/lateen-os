import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import { createConversationRepository } from '../src/conversation/repository.impl.js';
import { createConversationLifecycle } from '../src/conversation/lifecycle.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement without collaborators', () => {
  it('every method degrades to null when nothing is injected', async () => {
    const relationships = createRelationshipManagement({});
    const conversation = await createConversationLifecycle(createConversationRepository()).create(ORG, { conversationType: 'support', subject: 'Test' });

    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(await relationships.getCampaignContext(ORG, 'campaign-1')).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logConversationToMemory(ORG, conversation)).toBeNull();
    expect(await relationships.getWorkflowInstanceContext(ORG, 'instance-1')).toBeNull();
    expect(await relationships.getAiWorkerContext(ORG, 'worker-1')).toBeNull();
  });
});

describe('createRelationshipManagement with all 7 real sibling runtimes', () => {
  function setup() {
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const marketing = createMarketingRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const workflow = createWorkflowRuntime();
    const aiWorkforce = createWorkforceRuntime();
    const relationships = createRelationshipManagement({ crm, sales, marketing, businessDna, institutionalMemory, workflow, aiWorkforce });
    const conversations = createConversationLifecycle(createConversationRepository());
    return { crm, sales, marketing, businessDna, institutionalMemory, workflow, aiWorkforce, relationships, conversations };
  }

  it('getCustomerContext() fetches a real CRM Engine customer', async () => {
    const { crm, relationships } = setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    const context = await relationships.getCustomerContext(ORG, customer.id);
    expect(context?.name).toBe('Acme Corp');
  });

  it('getOpportunityContext() fetches a real Sales Engine opportunity', async () => {
    const { sales, relationships } = setup();
    const opportunity = await sales.opportunities.create(ORG, { name: 'Acme — Deal' });
    const context = await relationships.getOpportunityContext(ORG, opportunity.id);
    expect(context?.name).toBe('Acme — Deal');
  });

  it('getCampaignContext() fetches a real Marketing Engine campaign', async () => {
    const { marketing, relationships } = setup();
    const campaign = await marketing.campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });
    const context = await relationships.getCampaignContext(ORG, campaign.id);
    expect(context?.name).toBe('Spring Launch');
  });

  it('getBusinessProfileContext() fetches a real Business DNA business profile', async () => {
    const { businessDna, relationships } = setup();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Manufacturing',
      legalEntity: {
        legalName: 'Acme Manufacturing LLC',
        entityType: 'llc',
        registrationNumber: 'REG-001',
        taxId: 'TAX-001',
        countryOfIncorporation: 'US',
      },
    });
    const context = await relationships.getBusinessProfileContext(ORG);
    expect(context?.displayName).toBe('Acme Manufacturing');
  });

  it('logConversationToMemory() creates a real Institutional Memory observation entry', async () => {
    const { relationships, conversations, institutionalMemory } = setup();
    const conversation = await conversations.create(ORG, { conversationType: 'support', subject: 'Order #1042 delay' });

    const entry = await relationships.logConversationToMemory(ORG, conversation);
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe('Order #1042 delay');
    expect(entry?.knowledgeType).toBe('observation');
    expect(entry?.category).toBe('operational');
    expect(entry?.source).toBe('communication-hub');
    expect(entry?.tags).toEqual(['communication', 'support']);

    const persisted = await institutionalMemory.lifecycle.get(ORG, entry!.id);
    expect(persisted).not.toBeNull();
  });

  it('getWorkflowInstanceContext() fetches a real running Workflow Engine instance', async () => {
    const { workflow, relationships } = setup();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.workflow',
      name: 'Test Workflow',
      metadata: { category: 'operational' },
      version: '1.0.0',
      steps: [{ stepId: 'step-1', code: 'step-1', name: 'Step 1', type: 'human', optional: false }],
      transitions: [],
    });
    const instance = await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const context = await relationships.getWorkflowInstanceContext(ORG, instance.id);
    expect(context?.id).toBe(instance.id);
  });

  it('getWorkflowInstanceContext() returns null for an unknown instance', async () => {
    const { relationships } = setup();
    expect(await relationships.getWorkflowInstanceContext(ORG, 'missing')).toBeNull();
  });

  it('getAiWorkerContext() fetches a real AI Workforce worker', async () => {
    const { aiWorkforce, relationships } = setup();
    const worker = await aiWorkforce.lifecycle.hire({
      organizationId: ORG,
      businessDnaAgentId: 'agent-1',
      runtimeAgentId: 'runtime-agent-1',
      profile: {
        displayName: 'Ava',
        title: 'Sales Assistant',
        workforceType: 'sales_ai',
        proactiveEnabled: true,
        reactiveEnabled: true,
      },
    });

    const context = await relationships.getAiWorkerContext(ORG, worker.id);
    expect(context?.profile.displayName).toBe('Ava');
  });

  it('is organization-scoped for CRM context lookups', async () => {
    const { crm, relationships } = setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    expect(await relationships.getCustomerContext('org-2', customer.id)).toBeNull();
  });
});
