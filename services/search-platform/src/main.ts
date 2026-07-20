import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';
import { createSearchService } from './bootstrap/factory';
import { createSearchIndexQueue } from './workers/search-queue';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);
  const queue = createSearchIndexQueue(config.USE_REDIS && config.NODE_ENV !== 'test', config.REDIS_URL);
  const searchService = createSearchService();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ config, searchService }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });
  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Search Platform listening on ${config.HOST}:${config.PORT}`);

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
  console.error('Failed to start Search Platform', error);
  process.exit(1);
});
