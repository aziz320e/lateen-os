import 'reflect-metadata';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { loadConfig } from './config/index.js';

/** Platform Bootstrap — the single entry point that starts the Lateen OS platform backend host. */
async function bootstrap(): Promise<void> {
  const config = loadConfig();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ config }),
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableCors({
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyHelmet, {
    // Swagger UI (mounted below at `api/docs`) serves inline scripts/styles —
    // the default strict CSP blocks it, so CSP is disabled here rather than
    // hand-maintaining a nonce list. Every other helmet header (HSTS,
    // X-Frame-Options, X-Content-Type-Options, etc.) stays on.
    contentSecurityPolicy: false,
  });
  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Validation Pipes — global, but a no-op for the pre-existing plain-interface
  // request bodies (Task 1-3 endpoints), since Nest can only validate against a
  // real class DTO's reflected metatype. Every Task 4 v1 controller DTO is a
  // real class, so this is what actually enforces those.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  // OpenAPI / Swagger — documents the versioned v1 REST API built in Task 4.
  const openApiDocument = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Lateen OS Platform API')
      .setDescription('Enterprise REST API over the Lateen OS business engine runtimes.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, openApiDocument);

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Lateen OS Platform Backend Host listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start Platform Backend Host', error);
  process.exit(1);
});
