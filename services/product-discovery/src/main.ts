import { loadConfig } from './config/index.js';
import { getPrismaClient, disconnectPrisma } from './database/index.js';
import { createRepositories } from './repositories/prisma-repositories.js';
import { createAllMockAdapters } from './adapters/implementations/mock-adapters.js';
import { CachedSignalAggregator } from './infrastructure/signal-aggregator.js';
import { createCacheStore, type CacheStore } from './infrastructure/cache/redis-cache.js';
import { BusinessDnaHttpClient } from './infrastructure/clients/business-dna-client.js';
import { BusinessDnaCapabilityEngineClient } from './infrastructure/clients/capability-engine-client.js';
import { createDecisionEngineAdapter } from './infrastructure/clients/decision-engine-adapter.js';
import { createIntelligenceEngineAdapter } from './infrastructure/clients/intelligence-engine-adapter.js';
import { createAiRuntimeAdapter } from './infrastructure/clients/ai-runtime-adapter.js';
import {
  createCapabilityMatchingStage,
  createCollectSignalsStage,
  createDecisionSubmissionStage,
  createNormalizeStage,
  createProfitEstimationStage,
  createRankStage,
  createRecommendationStage,
} from './workflows/implementations/workflow-stages.impl.js';
import { createProductDiscoveryWorkflow } from './workflows/implementations/product-discovery-workflow.impl.js';
import { createProductDiscoveryService } from './application/product-discovery-service.impl.js';
import { createServer } from './api/server.js';
import {
  NoOpDiscoveryEventPublisher,
  createEventPublisher,
  type NatsDiscoveryEventPublisher,
} from './events/nats-publisher.js';
import { initTelemetry } from './infrastructure/observability/telemetry.js';
import {
  startNatsIntegration,
  type NatsIntegration,
} from './infrastructure/integration/nats-subscriber.js';

async function main() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const prisma = getPrismaClient(config.DATABASE_URL);
  const repositories = createRepositories(prisma);
  const cache = createCacheStore(
    config.REDIS_URL,
    config.CACHE_TTL_SECONDS,
    config.NODE_ENV,
    config.USE_REDIS,
  );

  const businessDna = new BusinessDnaHttpClient(config.BUSINESS_DNA_BASE_URL, cache);
  const capabilityEngine = new BusinessDnaCapabilityEngineClient(businessDna, cache);

  let eventsPublisher: NatsDiscoveryEventPublisher | NoOpDiscoveryEventPublisher =
    new NoOpDiscoveryEventPublisher();
  if (config.USE_NATS) {
    try {
      eventsPublisher = await createEventPublisher(config.NATS_URL, config.NATS_SUBJECT_PREFIX);
    } catch (error) {
      console.error('Failed to connect to NATS; falling back to no-op event publisher', error);
    }
  }

  const decisionEngine = createDecisionEngineAdapter(cache, eventsPublisher);
  const intelligenceEngine = createIntelligenceEngineAdapter(cache);
  const aiRuntime = createAiRuntimeAdapter(cache);

  const signalAdapters = createAllMockAdapters();
  const signalAggregator = new CachedSignalAggregator(signalAdapters, cache);

  const stages = {
    collectSignals: createCollectSignalsStage(signalAggregator),
    normalize: createNormalizeStage(),
    rank: createRankStage(),
    capabilityMatching: createCapabilityMatchingStage(capabilityEngine, businessDna),
    profitEstimation: createProfitEstimationStage(),
    decisionSubmission: createDecisionSubmissionStage(intelligenceEngine, decisionEngine),
    recommendation: createRecommendationStage(intelligenceEngine),
  };

  let natsIntegration: NatsIntegration | undefined;
  if (config.USE_NATS) {
    try {
      natsIntegration = await startNatsIntegration(config.NATS_URL, cache);
    } catch (error) {
      console.error('Failed to start NATS integration; cache invalidation subscriptions disabled', error);
    }
  }

  const workflow = createProductDiscoveryWorkflow({
    stages,
    repositories,
    events: eventsPublisher,
    cache,
  });
  const service = createProductDiscoveryService(workflow, repositories, aiRuntime, cache);

  const app = await createServer({ config, service, cache });

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info({ port: config.PORT }, 'Product Discovery service started');
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }

  const shutdown = async () => {
    await app.close();
    if ('close' in eventsPublisher && typeof eventsPublisher.close === 'function') {
      await eventsPublisher.close();
    }
    await natsIntegration?.close();
    await closeCacheStore(cache);
    await disconnectPrisma();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

async function closeCacheStore(cache: CacheStore): Promise<void> {
  if ('close' in cache && typeof cache.close === 'function') {
    await cache.close();
  }
}

main();
