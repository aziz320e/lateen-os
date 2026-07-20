import 'reflect-metadata';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { loadConfig } from '../../src/config/index';
import { AuthService } from '../../src/application/auth.service';
import { ApiKeyService } from '../../src/application/api-key.service';
import { ServiceAccountService } from '../../src/application/service-account.service';
import { AppModule } from '../../src/app.module';
import { NoOpAuditLogger } from '../../src/infrastructure/audit/audit-logger';
import { NoOpIdentityEventPublisher } from '../../src/events/nats-publisher';
import { ScryptPasswordHasher } from '../../src/infrastructure/auth/password-hasher';
import { JwtTokenService } from '../../src/infrastructure/auth/jwt.service';
import { KeycloakAdapterImpl } from '../../src/infrastructure/auth/keycloak.adapter';
import { DevelopmentAuthorizationProvider } from '../../src/infrastructure/authorization/authorization.provider';
import { InMemoryRateLimiter } from '../../src/infrastructure/cache/redis-store';
import { IdentityRepositories } from '../../src/repositories/identity-repositories';

function createMockRepos(): IdentityRepositories {
  const store = {
    orgs: [] as { id: string; organizationId: string; name: string }[],
    users: [] as Record<string, unknown>[],
    sessions: [] as Record<string, unknown>[],
    refreshTokens: [] as Record<string, unknown>[],
    apiKeys: [] as Record<string, unknown>[],
    serviceAccounts: [] as Record<string, unknown>[],
  };

  const prisma = {
    organizationIdentity: {
      findFirst: async ({ where }: { where: { organizationId?: string } }) =>
        store.orgs.find((o) => o.organizationId === where.organizationId) ?? null,
      findUnique: async ({ where }: { where: { id?: string } }) =>
        store.orgs.find((o) => o.id === where.id) ?? null,
      upsert: async () => ({}),
    },
    user: {
      findFirst: async () => null,
      findUnique: async () => null,
      update: async () => ({ failedAttempts: 0 }),
      upsert: async () => ({}),
    },
    session: { create: async () => ({ id: 'session-1' }) },
    refreshToken: {
      findFirst: async () => null,
      create: async () => ({}),
      update: async () => ({}),
    },
    device: { upsert: async () => ({}) },
    apiKey: { findMany: async () => [], create: async () => ({}), update: async () => ({}) },
    serviceAccount: { findMany: async () => [], create: async () => ({}) },
    auditLog: { create: async () => ({}) },
    permissionGrant: { create: async () => ({}), update: async () => ({ subject: 'u1', permission: 'read' }) },
  };

  return new IdentityRepositories(prisma as never);
}

describe('API', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const config = loadConfig({
      NODE_ENV: 'test',
      LOG_LEVEL: 'fatal',
      JWT_SECRET: 'test-secret-min-16-chars',
      USE_REDIS: 'false',
      USE_NATS: 'false',
    });

    const repos = createMockRepos();
    const passwordHasher = new ScryptPasswordHasher();
    const authService = new AuthService(
      repos,
      config,
      passwordHasher,
      new JwtTokenService(config),
      new KeycloakAdapterImpl(config),
      new DevelopmentAuthorizationProvider(),
      new InMemoryRateLimiter(),
      new NoOpAuditLogger(),
      new NoOpIdentityEventPublisher(),
    );

    app = await NestFactory.create(
      AppModule.register({
        config,
        authService,
        apiKeyService: new ApiKeyService(repos, passwordHasher, new NoOpAuditLogger(), new NoOpIdentityEventPublisher()),
        serviceAccountService: new ServiceAccountService(repos, passwordHasher, new NoOpAuditLogger()),
      }),
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', service: 'identity-service' });
  });

  it('GET /api/v1/security/rotation-contracts returns contracts', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/security/rotation-contracts' });
    expect(response.statusCode).toBe(200);
    expect(response.json().contracts).toHaveLength(4);
  });

  it('POST /api/v1/auth/login rejects invalid body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { username: 'admin' },
    });
    expect(response.statusCode).toBe(400);
  });
});
