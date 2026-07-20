import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { getPrismaClient, disconnectPrisma } from './database/prisma-client';
import { createRepositories } from './repositories/integration-repositories';
import {
  createIntegrationEventPublisher,
  NoOpIntegrationEventPublisher,
} from './events/nats-publisher';
import { createJobQueue } from './jobs/job-queue';
import { ConnectorService, MonitoringService, SyncService } from './application/integration.services';
import { WebhookService } from './webhooks/webhook.service';
import { JobService } from './jobs/job.service';
import { MappingService } from './mapping/mapping.service';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const prisma = getPrismaClient();
  const repos = createRepositories(prisma);
  const jobs = createJobQueue(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);

  const events =
    config.NODE_ENV === 'test' || !config.USE_NATS
      ? new NoOpIntegrationEventPublisher()
      : createIntegrationEventPublisher(config.NATS_URL, config.NATS_SUBJECT_PREFIX);

  const connectorService = new ConnectorService(repos.connectors, events);
  const syncService = new SyncService(repos.connectors, repos.sync, jobs, events);
  const webhookService = new WebhookService(repos.connectors, repos.webhooks, events);
  const jobService = new JobService(jobs);
  const mappingService = new MappingService(repos.mappings);
  const monitoringService = new MonitoringService(repos.connectors, repos.sync, jobs);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      config,
      connectorService,
      syncService,
      webhookService,
      jobService,
      mappingService,
      monitoringService,
    }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Integration Hub listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    await disconnectPrisma();
    if (events && 'close' in events && typeof events.close === 'function') {
      await events.close();
    }
    if (jobs && 'close' in jobs && typeof jobs.close === 'function') {
      await jobs.close();
    }
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start Integration Hub', error);
  process.exit(1);
});
