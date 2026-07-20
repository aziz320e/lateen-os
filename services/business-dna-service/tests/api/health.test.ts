import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/index.js';
import { createApplicationServices } from '../../src/application/crud-service.js';
import { NoOpEventPublisher } from '../../src/events/noop-publisher.js';
import { createRepositories } from '../../src/repositories/prisma-repositories.js';
import { createServer } from '../../src/api/server.js';
import { DevelopmentAuthProvider } from '../../src/infrastructure/auth/keycloak-auth.js';
import { DevelopmentAuthorizationProvider } from '../../src/infrastructure/auth/authorization.js';

describe('API', () => {
  it('GET /health returns ok', async () => {
    process.env.NODE_ENV = 'test';
    const config = loadConfig({ ...process.env, NODE_ENV: 'test', LOG_LEVEL: 'fatal' });

    const mockPrisma = {
      organization: { findUnique: async () => null, upsert: async () => ({}), delete: async () => ({}) },
    } as never;

    const repositories = createRepositories(mockPrisma);
    const services = createApplicationServices(repositories, new NoOpEventPublisher());

    const app = await createServer({
      config,
      services,
      repositories,
      authProvider: new DevelopmentAuthProvider(),
      authorizationProvider: new DevelopmentAuthorizationProvider(),
    });

    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
    await app.close();
  });
});
