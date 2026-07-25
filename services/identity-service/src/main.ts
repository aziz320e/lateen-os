import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from './config/index';
import { getPrismaClient, disconnectPrisma } from './database/prisma-client';
import { createRepositories } from './repositories/identity-repositories';
import { ScryptPasswordHasher } from './infrastructure/auth/password-hasher';
import { JwtTokenService } from './infrastructure/auth/jwt.service';
import { KeycloakAdapterImpl } from './infrastructure/auth/keycloak.adapter';
import {
  BusinessDnaAuthorizationProvider,
  DecisionEngineAuthorizationProvider,
  DevelopmentAuthorizationProvider,
  HttpBusinessDnaClient,
} from './infrastructure/authorization/authorization.provider';
import { createRateLimiter, createSessionStore } from './infrastructure/cache/redis-store';
import { PrismaAuditLogger, NoOpAuditLogger } from './infrastructure/audit/audit-logger';
import {
  createIdentityEventPublisher,
  NoOpIdentityEventPublisher,
} from './events/nats-publisher';
import { AuthService } from './application/auth.service';
import { ApiKeyService } from './application/api-key.service';
import { ServiceAccountService } from './application/service-account.service';
import { initTelemetry } from './infrastructure/observability/telemetry';
import { AppModule } from './app.module';

async function bootstrap() {
  const config = loadConfig();
  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const prisma = getPrismaClient(config.DATABASE_URL);
  const repos = createRepositories(prisma);
  const passwordHasher = new ScryptPasswordHasher();
  const tokenService = new JwtTokenService(config);
  const keycloak = new KeycloakAdapterImpl(config);
  const bdsClient = new HttpBusinessDnaClient(config.BUSINESS_DNA_BASE_URL);
  const localPermissions = new Map<string, string[]>();

  const authorization =
    config.NODE_ENV === 'test'
      ? new DevelopmentAuthorizationProvider()
      : new DecisionEngineAuthorizationProvider(
          new BusinessDnaAuthorizationProvider(bdsClient, localPermissions),
          config,
        );

  const rateLimiter = createRateLimiter(config.REDIS_URL, config.NODE_ENV, config.USE_REDIS);
  createSessionStore(config.REDIS_URL, config.JWT_REFRESH_TTL_SECONDS, config.NODE_ENV, config.USE_REDIS);

  const audit =
    config.NODE_ENV === 'test' ? new NoOpAuditLogger() : new PrismaAuditLogger(prisma);

  const events =
    config.NODE_ENV === 'test' || !config.USE_NATS
      ? new NoOpIdentityEventPublisher()
      : createIdentityEventPublisher(config.NATS_URL, config.NATS_SUBJECT_PREFIX);

  const authService = new AuthService(
    repos,
    config,
    passwordHasher,
    tokenService,
    keycloak,
    authorization,
    rateLimiter,
    audit,
    events,
  );

  const apiKeyService = new ApiKeyService(repos, passwordHasher, audit, events);
  const serviceAccountService = new ServiceAccountService(repos, passwordHasher, audit);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register({ config, authService, apiKeyService, serviceAccountService }),
    new FastifyAdapter({ logger: false }),
  );

  app.enableCors({ origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN });

  await app.listen({ port: config.PORT, host: config.HOST });
  console.log(`Identity service listening on ${config.HOST}:${config.PORT}`);

  const shutdown = async () => {
    await app.close();
    await disconnectPrisma();
    if (events && 'close' in events && typeof events.close === 'function') {
      await events.close();
    }
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((error) => {
  console.error('Failed to start identity service', error);
  process.exit(1);
});
