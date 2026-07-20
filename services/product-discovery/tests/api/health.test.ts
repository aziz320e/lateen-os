import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/index.js';
import { createRepositories } from '../../src/repositories/prisma-repositories.js';
import { createAllMockAdapters } from '../../src/adapters/implementations/mock-adapters.js';
import { CachedSignalAggregator } from '../../src/infrastructure/signal-aggregator.js';
import { InMemoryCacheStore } from '../../src/infrastructure/cache/redis-cache.js';
import { BusinessDnaCapabilityEngineClient } from '../../src/infrastructure/clients/capability-engine-client.js';
import { createDecisionEngineAdapter } from '../../src/infrastructure/clients/decision-engine-adapter.js';
import { createIntelligenceEngineAdapter } from '../../src/infrastructure/clients/intelligence-engine-adapter.js';
import { createAiRuntimeAdapter } from '../../src/infrastructure/clients/ai-runtime-adapter.js';
import {
  createCapabilityMatchingStage,
  createCollectSignalsStage,
  createDecisionSubmissionStage,
  createNormalizeStage,
  createProfitEstimationStage,
  createRankStage,
  createRecommendationStage,
} from '../../src/workflows/implementations/workflow-stages.impl.js';
import { createProductDiscoveryWorkflow } from '../../src/workflows/implementations/product-discovery-workflow.impl.js';
import { createProductDiscoveryService } from '../../src/application/product-discovery-service.impl.js';
import { createServer } from '../../src/api/server.js';
import { NoOpDiscoveryEventPublisher } from '../../src/events/nats-publisher.js';
import type { BusinessDnaPort } from '../../src/ports/outbound/business-dna-port.js';
import type { OrganizationId } from '../../src/domain/identifiers.js';

const orgId = '00000000-0000-4000-8000-000000000001' as OrganizationId;

const mockBusinessDna: BusinessDnaPort = {
  getOrganization: async () => null,
  listProducts: async () => [],
  getProduct: async () => null,
  listMachines: async () => [],
  getMachine: async () => null,
  listProjects: async () => [],
  getProject: async () => null,
  listCustomers: async () => [],
  getCustomer: async () => null,
  listBranches: async () => [],
  getBranch: async () => null,
  listDepartments: async () => [],
  getDepartment: async () => null,
  listAgents: async () => [],
  getAgent: async () => null,
  loadCatalog: async () => ({
    organization: null,
    products: [],
    machines: [],
    projects: [],
    customers: [],
    branches: [],
    departments: [],
    agents: [],
  }),
};

describe('API', () => {
  it('GET /health returns ok', async () => {
    const config = loadConfig({ ...process.env, NODE_ENV: 'test', LOG_LEVEL: 'fatal' });
    const mockPrisma = {} as never;
    const repositories = createRepositories(mockPrisma);
    const cache = new InMemoryCacheStore();
    const capabilityEngine = new BusinessDnaCapabilityEngineClient(mockBusinessDna, cache);
    const decisionEngine = createDecisionEngineAdapter(cache, new NoOpDiscoveryEventPublisher());
    const intelligenceEngine = createIntelligenceEngineAdapter(cache);
    const signalAggregator = new CachedSignalAggregator(createAllMockAdapters(), cache);

    const stages = {
      collectSignals: createCollectSignalsStage(signalAggregator),
      normalize: createNormalizeStage(),
      rank: createRankStage(),
      capabilityMatching: createCapabilityMatchingStage(capabilityEngine, mockBusinessDna),
      profitEstimation: createProfitEstimationStage(),
      decisionSubmission: createDecisionSubmissionStage(intelligenceEngine, decisionEngine),
      recommendation: createRecommendationStage(intelligenceEngine),
    };

    const workflow = createProductDiscoveryWorkflow({
      stages,
      repositories,
      events: new NoOpDiscoveryEventPublisher(),
      cache,
    });
    const service = createProductDiscoveryService(workflow, repositories);
    const app = await createServer({ config, service, cache });

    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    await app.close();
  });

  it('GET /platform/health returns platform status', async () => {
    const config = loadConfig({ ...process.env, NODE_ENV: 'test', LOG_LEVEL: 'fatal' });
    const mockPrisma = {} as never;
    const repositories = createRepositories(mockPrisma);
    const cache = new InMemoryCacheStore();
    const capabilityEngine = new BusinessDnaCapabilityEngineClient(mockBusinessDna, cache);
    const decisionEngine = createDecisionEngineAdapter(cache, new NoOpDiscoveryEventPublisher());
    const intelligenceEngine = createIntelligenceEngineAdapter(cache);
    const signalAggregator = new CachedSignalAggregator(createAllMockAdapters(), cache);

    const stages = {
      collectSignals: createCollectSignalsStage(signalAggregator),
      normalize: createNormalizeStage(),
      rank: createRankStage(),
      capabilityMatching: createCapabilityMatchingStage(capabilityEngine, mockBusinessDna),
      profitEstimation: createProfitEstimationStage(),
      decisionSubmission: createDecisionSubmissionStage(intelligenceEngine, decisionEngine),
      recommendation: createRecommendationStage(intelligenceEngine),
    };

    const workflow = createProductDiscoveryWorkflow({
      stages,
      repositories,
      events: new NoOpDiscoveryEventPublisher(),
      cache,
    });
    const service = createProductDiscoveryService(workflow, repositories);
    const app = await createServer({ config, service, cache });

    const response = await app.inject({ method: 'GET', url: '/platform/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json() as { status: string; services: unknown[] };
    expect(body.status).toMatch(/ok|degraded/);
    expect(body.services.length).toBeGreaterThan(0);
    await app.close();
  });
});

describe('platform adapters', () => {
  it('maps RecommendationCandidate through Decision Engine adapter', async () => {
    const cache = new InMemoryCacheStore();
    const events = new NoOpDiscoveryEventPublisher();
    const intelligence = createIntelligenceEngineAdapter(cache);
    const decision = createDecisionEngineAdapter(cache, events);
    const org = orgId;

    const opportunity = await intelligence.mapToProductOpportunity(org, {
      opportunityId: '00000000-0000-4000-8000-000000000010' as never,
      organizationId: org,
      normalizedSignalIds: [],
      title: 'Test opportunity',
      rank: 1,
      tier: 'high',
      compositeScore: '0.82',
      demandScore: '0.80',
      trendScore: '0.75',
      marketFitScore: '0.78',
    });

    const candidate = await intelligence.createRecommendationCandidate(org, opportunity);
    const decisionRef = await decision.submitForDecision(org, {
      organizationId: org,
      decisionId: '00000000-0000-4000-8000-000000000020' as never,
      recommendationCandidateId: candidate.id,
      profitEstimateIds: [],
      decisionCategory: 'strategic',
      title: candidate.title,
      summary: candidate.summary,
      proposedAction: candidate.proposedAction,
      status: 'submitted',
    });

    expect(decisionRef.status).toBe('submitted');
    const recommendations = await decision.getRecommendation(org, decisionRef.id);
    expect(recommendations).toHaveLength(1);
  });

  it('registers DiscoveryRun as AI Runtime task', async () => {
    const cache = new InMemoryCacheStore();
    const aiRuntime = createAiRuntimeAdapter(cache);
    const runId = '00000000-0000-4000-8000-000000000030' as never;
    const agentId = '00000000-0000-4000-8000-000000000040' as never;

    const taskId = await aiRuntime.scheduleDiscoveryTask({
      organizationId: orgId,
      runId,
      runtimeAgentId: agentId,
      title: 'Integration test run',
    });

    const task = await aiRuntime.getTask(orgId, taskId);
    expect(task?.status).toBe('running');
  });
});
