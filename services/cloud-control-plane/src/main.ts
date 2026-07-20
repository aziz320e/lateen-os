import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';
import { createCloudService } from './bootstrap/factory';
import { createCloudQueue } from './workers/cloud-queue';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);
  const queue = createCloudQueue(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);
  const cloudService = createCloudService(config);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ config, cloudService }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Cloud Control Plane listening on ${config.HOST}:${config.PORT}`);

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
  console.error('Failed to start Cloud Control Plane', error);
  process.exit(1);
});
