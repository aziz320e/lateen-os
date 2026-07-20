import { loadConfig } from './config/index.js';
import { getPrismaClient, disconnectPrisma } from './database/index.js';
import { createRepositories } from './repositories/prisma-repositories.js';
import { createApplicationServices } from './application/crud-service.js';
import { createEventPublisher } from './events/nats-publisher.js';
import { NoOpEventPublisher } from './events/noop-publisher.js';
import { createServer } from './api/server.js';
import { DevelopmentAuthProvider } from './infrastructure/auth/keycloak-auth.js';
import { DevelopmentAuthorizationProvider } from './infrastructure/auth/authorization.js';
import { initTelemetry } from './infrastructure/observability/telemetry.js';

async function main() {
  const config = loadConfig();

  const telemetry = initTelemetry(config.OTEL_SERVICE_NAME, config.OTEL_EXPORTER_OTLP_ENDPOINT);

  const prisma = getPrismaClient();
  const repositories = createRepositories(prisma);

  const eventPublisher =
    config.NODE_ENV === 'test'
      ? new NoOpEventPublisher()
      : createEventPublisher(config.NATS_URL, config.NATS_SUBJECT_PREFIX);

  const services = createApplicationServices(repositories, eventPublisher);

  const app = await createServer({
    config,
    services,
    repositories,
    authProvider: new DevelopmentAuthProvider(),
    authorizationProvider: new DevelopmentAuthorizationProvider(),
  });

  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    app.log.info({ port: config.PORT }, 'Business DNA service started');
  } catch (error) {
    app.log.error(error, 'Failed to start server');
    process.exit(1);
  }

  const shutdown = async () => {
    await app.close();
    await disconnectPrisma();
    await telemetry?.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
