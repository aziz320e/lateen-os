import { randomUUID } from 'node:crypto';
import type { ProductDiscoveryService } from '../ports/inbound/product-discovery-service.js';
import type {
  GetDiscoveryRunQuery,
  ListDiscoveryRecommendationsQuery,
  ListDiscoveryRunsQuery,
  RunProductDiscoveryCommand,
} from '../ports/inbound/product-discovery-service.js';
import type { ProductDiscoveryWorkflow } from '../workflows/product-discovery-workflow.js';
import type { Repositories } from '../repositories/ports.js';
import type { DiscoveryRunId } from '../domain/identifiers.js';
import type { AiRuntimePort } from '../ports/outbound/ai-runtime-port.js';
import type { CacheStore } from '../infrastructure/cache/redis-cache.js';
import { completeDiscoveryTask } from '../infrastructure/clients/ai-runtime-adapter.js';

export class ProductDiscoveryServiceImpl implements ProductDiscoveryService {
  constructor(
    private readonly workflow: ProductDiscoveryWorkflow,
    private readonly repositories: Repositories,
    private readonly aiRuntime?: AiRuntimePort,
    private readonly cache?: CacheStore,
  ) {}

  async runDiscovery(command: RunProductDiscoveryCommand) {
    const runId = randomUUID() as DiscoveryRunId;
    let runtimeTaskId: string | undefined;

    if (command.runtimeAgentId && this.aiRuntime) {
      runtimeTaskId = await this.aiRuntime.scheduleDiscoveryTask({
        organizationId: command.organizationId,
        runId,
        runtimeAgentId: command.runtimeAgentId as never,
        title: `Discovery run ${runId as string}`,
      });
    }

    try {
      const { run } = await this.workflow.execute({
        organizationId: command.organizationId,
        runId,
        keywords: command.keywords,
        runtimeAgentId: command.runtimeAgentId,
        runtimeTaskId,
      });
      if (this.cache) {
        await completeDiscoveryTask(this.cache, runId, run.status === 'completed');
      }
      return run;
    } catch (error) {
      if (this.cache) {
        await completeDiscoveryTask(this.cache, runId, false);
      }
      throw error;
    }
  }

  async getRun(query: GetDiscoveryRunQuery) {
    return this.repositories.discoveryRun.findById(query.organizationId, query.runId);
  }

  async listRuns(query: ListDiscoveryRunsQuery) {
    return this.repositories.discoveryRun.findByOrganization(query.organizationId);
  }

  async listRecommendations(query: ListDiscoveryRecommendationsQuery) {
    if (query.runId) {
      return this.repositories.recommendation.findByRun(query.runId);
    }
    return this.repositories.recommendation.findByOrganization(query.organizationId, query.limit);
  }
}

export function createProductDiscoveryService(
  workflow: ProductDiscoveryWorkflow,
  repositories: Repositories,
  aiRuntime?: AiRuntimePort,
  cache?: CacheStore,
): ProductDiscoveryService {
  return new ProductDiscoveryServiceImpl(workflow, repositories, aiRuntime, cache);
}
