import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { ProvisioningService } from './application/provisioning.service';
import { InMemoryProvisioningRepository } from './repositories/provisioning-repository';
import { StubStepOrchestrator } from './orchestrator/step-orchestrator';
import { createProvisioningQueue } from './jobs/provisioning-queue';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);
  const queue = createProvisioningQueue(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);
  const repo = new InMemoryProvisioningRepository();
  const orchestrator = new StubStepOrchestrator();
  const provisioningService = new ProvisioningService(repo, orchestrator, queue);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ config, provisioningService }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Provisioning service listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    if (queue.close) await queue.close();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start Provisioning service', error);
  process.exit(1);
});
