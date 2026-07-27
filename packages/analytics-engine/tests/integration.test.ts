import { describe, expect, it } from 'vitest';
import { createComplianceRuntime } from '@lateen-os/ai-compliance-engine';
import { createGovernanceRuntime } from '@lateen-os/ai-governance-engine';
import { createSecurityRuntime } from '@lateen-os/ai-security-engine';
import { createWorkforceRuntime } from '@lateen-os/ai-workforce';
import { createBusinessDnaRuntime } from '@lateen-os/business-dna';
import { createCommunicationRuntime } from '@lateen-os/communication-hub';
import { createCrmRuntime } from '@lateen-os/crm-engine';
import {
  createApprovalFlowRepository,
  createDecisionQueries,
  createDecisionRepository,
  createRecommendationRepository,
  createRiskAssessmentRepository,
} from '@lateen-os/decision-engine';
import { createDomainGraphRuntime } from '@lateen-os/domain-graph';
import { createInstitutionalMemoryRuntime } from '@lateen-os/institutional-memory';
import {
  createBusinessOpportunityRepository,
  createCompetitorRepository,
  createIntelligenceQueries,
  createMachineOpportunityRepository,
  createMarketRepository,
  createPriceAnalysisRepository,
  createProductOpportunityRepository,
  createRecommendationCandidateRepository,
  createTrendRepository,
} from '@lateen-os/intelligence-engine';
import { createMarketingRuntime } from '@lateen-os/marketing-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';
import { createWorkflowRuntime } from '@lateen-os/workflow-engine';
import { createAnalyticsRuntime } from '../src/runtime.js';

const ORG = 'org-1';

function realDecisionQueries() {
  return createDecisionQueries({
    decisionRepository: createDecisionRepository(),
    recommendationRepository: createRecommendationRepository(),
    approvalFlowRepository: createApprovalFlowRepository(),
    riskAssessmentRepository: createRiskAssessmentRepository(),
  });
}

function realIntelligenceQueries() {
  return createIntelligenceQueries({
    trendRepository: createTrendRepository(),
    productOpportunityRepository: createProductOpportunityRepository(),
    machineOpportunityRepository: createMachineOpportunityRepository(),
    businessOpportunityRepository: createBusinessOpportunityRepository(),
    competitorRepository: createCompetitorRepository(),
    priceAnalysisRepository: createPriceAnalysisRepository(),
    marketRepository: createMarketRepository(),
    recommendationCandidateRepository: createRecommendationCandidateRepository(),
  });
}

describe('Analytics Platform — real integration with all 14 public collaborator APIs', () => {
  it('revenueAnalytics + salesAnalytics reflect real Sales Engine and CRM Engine data', async () => {
    const sales = createSalesRuntime();
    const crm = createCrmRuntime();

    const account = await crm.accounts.create(ORG, { name: 'Acme', industry: 'manufacturing' });
    const opportunity = await sales.opportunities.create(ORG, { name: 'Deal', accountId: account.id, amount: '2000' });
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'discovery');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'qualified');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'proposal');
    await sales.opportunities.advanceStage(ORG, opportunity.id, 'negotiation');
    await sales.opportunities.closeWon(ORG, opportunity.id);

    const analytics = createAnalyticsRuntime({ sales, crm });
    const revenueSnapshot = await analytics.revenueAnalytics.computeSnapshot(ORG);
    const salesSnapshot = await analytics.salesAnalytics.computeSnapshot(ORG);

    expect(revenueSnapshot.monthlyRevenue).toBeGreaterThan(0);
    expect(salesSnapshot.funnel.won).toBe(1);
  });

  it('marketingAnalytics reflects real Marketing Engine campaign metrics', async () => {
    const marketing = createMarketingRuntime();
    const campaign = await marketing.campaigns.create(ORG, { name: 'Campaign', campaignType: 'email' });
    await marketing.metrics.recordMetrics(ORG, campaign.id, { conversions: 5, customersAcquired: 2, cost: '200', revenue: '600' });

    const analytics = createAnalyticsRuntime({ marketing });
    const snapshot = await analytics.marketingAnalytics.computeSnapshot(ORG);
    expect(snapshot.roi).toBeGreaterThan(0);
  });

  it('communicationAnalytics reflects real Communication Hub message activity', async () => {
    const communicationHub = createCommunicationRuntime();
    const conversation = await communicationHub.conversations.create(ORG, { conversationType: 'customer' });
    const message = await communicationHub.messages.create(ORG, { conversationId: conversation.id, messageType: 'text', body: 'hi' });
    await communicationHub.messages.send(ORG, message.id);

    const analytics = createAnalyticsRuntime({ communicationHub });
    const snapshot = await analytics.communicationAnalytics.computeSnapshot(ORG);
    expect(snapshot.messageVolume).toBe(1);
  });

  it('workflowAnalytics reflects a real running Workflow Engine instance', async () => {
    const workflow = createWorkflowRuntime();
    const { definition } = await workflow.defineWorkflow({
      organizationId: ORG,
      code: 'test.wf',
      name: 'Test',
      metadata: { category: 'custom' },
      version: '1.0.0',
      steps: [{ stepId: 's1', code: 'review', name: 'Review', type: 'human', optional: false }],
      transitions: [],
    });
    await workflow.startWorkflow({ organizationId: ORG, definitionId: definition.id });

    const analytics = createAnalyticsRuntime({ workflow });
    const snapshot = await analytics.workflowAnalytics.computeSnapshot(ORG);
    expect(snapshot.activeWorkflows).toBeGreaterThanOrEqual(1);
  });

  it('securityAnalytics reflects a real AI Security Engine authentication failure', async () => {
    const aiSecurity = createSecurityRuntime();
    await aiSecurity.authentication.validateToken(ORG, 'not-a-real-token');

    const analytics = createAnalyticsRuntime({ aiSecurity });
    const snapshot = await analytics.securityAnalytics.computeSnapshot(ORG);
    expect(snapshot.authenticationFailures).toBe(1);
  });

  it('governanceAnalytics reflects a real AI Governance Engine active policy', async () => {
    const aiGovernance = createGovernanceRuntime();
    const policy = await aiGovernance.policies.create(ORG, { name: 'p', policyType: 'business' });
    await aiGovernance.policies.activate(ORG, policy.id);

    const analytics = createAnalyticsRuntime({ aiGovernance });
    const snapshot = await analytics.governanceAnalytics.computeSnapshot(ORG);
    expect(snapshot.activePolicies).toBe(1);
  });

  it('complianceAnalytics reflects a real AI Compliance Engine framework', async () => {
    const aiCompliance = createComplianceRuntime();
    await aiCompliance.frameworks.create(ORG, { frameworkCode: 'GDPR', name: 'GDPR' });

    const analytics = createAnalyticsRuntime({ aiCompliance });
    const snapshot = await analytics.complianceAnalytics.computeSnapshot(ORG);
    expect(snapshot.frameworkCoverage).toBe(0);
  });

  it('relationships.getInstitutionalMemoryContext() reflects real Institutional Memory data', async () => {
    const institutionalMemoryRuntime = createInstitutionalMemoryRuntime();
    const analytics = createAnalyticsRuntime({ institutionalMemory: institutionalMemoryRuntime.queries });
    const result = await analytics.relationships.getInstitutionalMemoryContext(ORG);
    expect(result).not.toBeNull();
    expect(result?.entries).toEqual([]);
  });

  it('relationships.getDomainGraphContext() reflects real Domain Graph statistics', async () => {
    const domainGraphRuntime = createDomainGraphRuntime();
    const analytics = createAnalyticsRuntime({ domainGraph: domainGraphRuntime.queries });
    const result = await analytics.relationships.getDomainGraphContext(ORG, 'graph-1');
    expect(result).not.toBeNull();
    expect(result?.entityCount).toBe(0);
  });

  it('relationships.getDecisionContext() reflects real Decision Engine pending approvals', async () => {
    const decisionQueries = realDecisionQueries();
    const analytics = createAnalyticsRuntime({ decisionEngine: decisionQueries });
    const result = await analytics.relationships.getDecisionContext(ORG);
    expect(result).not.toBeNull();
  });

  it('relationships.getIntelligenceContext() reflects real Intelligence Engine business opportunities', async () => {
    const intelligenceQueries = realIntelligenceQueries();
    const analytics = createAnalyticsRuntime({ intelligenceEngine: intelligenceQueries });
    const result = await analytics.relationships.getIntelligenceContext(ORG);
    expect(result).not.toBeNull();
  });

  it('relationships.getWorkforceUtilizationContext() reflects real (if empty) AI Workforce data', async () => {
    const aiWorkforce = createWorkforceRuntime();
    const analytics = createAnalyticsRuntime({ aiWorkforce: aiWorkforce.queries });
    const result = await analytics.relationships.getWorkforceUtilizationContext(ORG);
    expect(result).toEqual({ busyCount: 0, activeCount: 0, utilizationPercentage: 0 });
  });

  it('relationships.getBusinessProfileContext() reflects a real Business DNA business profile', async () => {
    const businessDna = createBusinessDnaRuntime();
    await businessDna.businessProfile.upsert(ORG, {
      displayName: 'Acme Corp',
      legalEntity: { legalName: 'Acme Corporation Ltd.', jurisdiction: 'US-DE' },
    });

    const analytics = createAnalyticsRuntime({ businessDna });
    const profile = await analytics.relationships.getBusinessProfileContext(ORG);
    expect(profile?.displayName).toBe('Acme Corp');
  });

  it('a single createAnalyticsRuntime() wires all 14 real collaborators together at once', async () => {
    const sales = createSalesRuntime();
    const crm = createCrmRuntime();
    const marketing = createMarketingRuntime();
    const communicationHub = createCommunicationRuntime();
    const workflow = createWorkflowRuntime();
    const aiSecurity = createSecurityRuntime();
    const aiGovernance = createGovernanceRuntime();
    const aiCompliance = createComplianceRuntime();
    const institutionalMemoryRuntime = createInstitutionalMemoryRuntime();
    const domainGraphRuntime = createDomainGraphRuntime();
    const decisionQueries = realDecisionQueries();
    const intelligenceQueries = realIntelligenceQueries();
    const aiWorkforce = createWorkforceRuntime();
    const businessDna = createBusinessDnaRuntime();

    const analytics = createAnalyticsRuntime({
      sales,
      crm,
      marketing,
      communicationHub,
      workflow,
      aiSecurity,
      aiGovernance,
      aiCompliance,
      institutionalMemory: institutionalMemoryRuntime.queries,
      domainGraph: domainGraphRuntime.queries,
      decisionEngine: decisionQueries,
      intelligenceEngine: intelligenceQueries,
      aiWorkforce: aiWorkforce.queries,
      businessDna,
    });

    expect(await analytics.relationships.getBusinessProfileContext(ORG)).toBeNull();
    const revenueSnapshot = await analytics.revenueAnalytics.computeSnapshot(ORG);
    expect(revenueSnapshot.mrr).toBe(0);

    const dashboard = await analytics.dashboards.create(ORG, { dashboardType: 'ceo', name: 'CEO' });
    expect(dashboard.id).toBeDefined();
  });
});
