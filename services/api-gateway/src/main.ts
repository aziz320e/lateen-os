import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule, createGatewayServices } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);
  const services = createGatewayServices(config);
  await services.auditPublisher.connect();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({
      config,
      proxyService: services.proxyService,
      healthAggregator: services.healthAggregator,
      metricsService: services.metrics,
      routes: services.routes,
    }),
    new FastifyAdapter({ logger: false, bodyLimit: config.MAX_REQUEST_BYTES }),
  );

  app.enableCors({
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'X-Correlation-Id',
      'X-Tenant-Id',
      'X-Api-Key',
      'X-Service-Token',
      'Accept-Language',
    ],
  });

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`API Gateway listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    await services.cache.close();
    await services.auditPublisher.close();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start API Gateway', error);
  process.exit(1);
});
