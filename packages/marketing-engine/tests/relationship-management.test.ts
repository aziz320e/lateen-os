import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';
import { createRelationshipManagement } from '../src/relationship-management/service.impl.js';
import { createMarketingLeadRepository } from '../src/lead-generation/repository.impl.js';
import { createLeadGenerationService } from '../src/lead-generation/service.impl.js';
import { createCampaignRepository } from '../src/campaign/repository.impl.js';
import { createCampaignLifecycle } from '../src/campaign/lifecycle.impl.js';

const ORG = 'org-1';

describe('createRelationshipManagement without collaborators', () => {
  it('every method degrades to null when nothing is injected', async () => {
    const relationships = createRelationshipManagement({});
    const lead = await createLeadGenerationService(createMarketingLeadRepository()).generateLead(ORG, { name: 'Jordan Lee', source: 'inbound' });
    const campaign = await createCampaignLifecycle(createCampaignRepository()).create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    expect(await relationships.syncLeadToCrm(ORG, lead)).toBeNull();
    expect(await relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
    expect(await relationships.getOpportunityContext(ORG, 'opp-1')).toBeNull();
    expect(await relationships.getBusinessProfileContext(ORG)).toBeNull();
    expect(await relationships.logCampaignToMemory(ORG, campaign)).toBeNull();
    expect(await relationships.syncCampaignToGraph(ORG, 'graph-1', campaign)).toBeNull();
  });
});

describe('createRelationshipManagement with real CRM Engine, Sales Engine, Business DNA, Institutional Memory, and Domain Graph runtimes', () => {
  function setup() {
    const crm = createCrmRuntime();
    const sales = createSalesRuntime();
    const businessDna = createBusinessDnaRuntime();
    const institutionalMemory = createInstitutionalMemoryRuntime();
    const domainGraph = createDomainGraphRuntime();
    const relationships = createRelationshipManagement({ crm, sales, businessDna, institutionalMemory, domainGraph });
    const leadGeneration = createLeadGenerationService(createMarketingLeadRepository());
    const campaigns = createCampaignLifecycle(createCampaignRepository());
    return { crm, sales, businessDna, institutionalMemory, domainGraph, relationships, leadGeneration, campaigns };
  }

  it('syncLeadToCrm() creates a real CRM Engine lead', async () => {
    const { relationships, leadGeneration, crm } = setup();
    const lead = await leadGeneration.generateLead(ORG, { name: 'Jordan Lee', email: 'jordan@example.com', source: 'referral' });

    const crmLead = await relationships.syncLeadToCrm(ORG, lead);
    expect(crmLead).not.toBeNull();
    expect(crmLead?.name).toBe('Jordan Lee');
    expect(crmLead?.source).toBe('referral');

    const persisted = await crm.leads.get(ORG, crmLead!.id);
    expect(persisted).not.toBeNull();
  });

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

  it('getOpportunityContext() returns null for an unknown opportunity', async () => {
    const { relationships } = setup();
    expect(await relationships.getOpportunityContext(ORG, 'missing')).toBeNull();
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

  it('logCampaignToMemory() creates a real Institutional Memory observation entry', async () => {
    const { relationships, campaigns, institutionalMemory } = setup();
    const campaign = await campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    const entry = await relationships.logCampaignToMemory(ORG, campaign);
    expect(entry).not.toBeNull();
    expect(entry?.title).toBe('Spring Launch');
    expect(entry?.knowledgeType).toBe('observation');
    expect(entry?.category).toBe('commercial');
    expect(entry?.source).toBe('marketing-engine');
    expect(entry?.tags).toEqual(['marketing', 'email']);

    const persisted = await institutionalMemory.lifecycle.get(ORG, entry!.id);
    expect(persisted).not.toBeNull();
  });

  it('syncCampaignToGraph() registers a real Domain Graph campaign node', async () => {
    const { relationships, campaigns, domainGraph } = setup();
    const graph = await domainGraph.graphs.create(ORG, { name: 'Marketing Graph' });
    const campaign = await campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    const node = await relationships.syncCampaignToGraph(ORG, graph.id, campaign);
    expect(node).not.toBeNull();
    expect(node?.nodeType).toBe('campaign');
    expect(node?.entityId).toBe(campaign.id);
    expect(node?.label).toBe('Spring Launch');

    const persisted = await domainGraph.entities.get(ORG, graph.id, node!.nodeId);
    expect(persisted).not.toBeNull();
  });

  it('syncCampaignToGraph() is idempotent — a second sync updates rather than duplicates', async () => {
    const { relationships, campaigns, domainGraph } = setup();
    const graph = await domainGraph.graphs.create(ORG, { name: 'Marketing Graph' });
    const campaign = await campaigns.create(ORG, { name: 'Spring Launch', campaignType: 'email' });

    const first = await relationships.syncCampaignToGraph(ORG, graph.id, campaign);
    const second = await relationships.syncCampaignToGraph(ORG, graph.id, campaign);

    expect(second?.nodeId).toBe(first?.nodeId);
    const allNodes = await domainGraph.entities.list(ORG, graph.id);
    expect(allNodes.filter((node) => node.nodeType === 'campaign' && node.entityId === campaign.id)).toHaveLength(1);
  });

  it('is organization-scoped for CRM context lookups', async () => {
    const { crm, relationships } = setup();
    const customer = await crm.customers.create(ORG, { name: 'Acme Corp' });
    expect(await relationships.getCustomerContext('org-2', customer.id)).toBeNull();
  });
});
