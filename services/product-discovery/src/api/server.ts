import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { AppConfig } from '../config/index.js';
import type { ProductDiscoveryService } from '../ports/inbound/product-discovery-service.js';
import type { CacheStore } from '../infrastructure/cache/redis-cache.js';
import { registerDiscoveryRoutes } from './routes/discovery-routes.js';
import { registerPlatformRoutes } from './routes/platform-routes.js';

export interface CreateServerDeps {
  config: AppConfig;
  service: ProductDiscoveryService;
  cache: CacheStore;
}

export async function createServer(deps: CreateServerDeps) {
  const app = Fastify({
    logger: {
      level: deps.config.LOG_LEVEL,
      base: { service: 'product-discovery-service' },
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Lateen OS — Product Discovery API',
        description: 'Discover manufacturable business opportunities',
        version: '1.0.0',
      },
      servers: [{ url: `http://${deps.config.HOST}:${deps.config.PORT}` }],
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.get('/health', async () => ({ status: 'ok', service: 'product-discovery-service' }));
  app.get('/metrics', async () => ({ status: 'ok', note: 'Use OTel collector for metrics' }));

  registerDiscoveryRoutes(app, deps.service);
  registerPlatformRoutes(app, { config: deps.config, cache: deps.cache });

  return app;
}
