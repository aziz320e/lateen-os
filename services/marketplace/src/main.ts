import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { createInMemoryRepositories } from './repositories/marketplace-repositories';
import {
  ExtensionService,
  InstallService,
  PublishService,
  PublisherService,
  ReleaseService,
  ReviewService,
  SearchService,
} from './application/marketplace.services';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { createMarketplaceCache } from './infrastructure/cache/redis-cache';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const repos = createInMemoryRepositories(config.NODE_ENV !== 'test');
  const cache = createMarketplaceCache(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);

  const publisherService = new PublisherService(repos);
  const extensionService = new ExtensionService(repos);
  const searchService = new SearchService(repos);
  const releaseService = new ReleaseService(repos);
  const publishService = new PublishService(repos);
  const installService = new InstallService(repos);
  const reviewService = new ReviewService(repos);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      config,
      publisherService,
      extensionService,
      searchService,
      releaseService,
      publishService,
      installService,
      reviewService,
    }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Marketplace listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    await cache?.close();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start Marketplace', error);
  process.exit(1);
});
