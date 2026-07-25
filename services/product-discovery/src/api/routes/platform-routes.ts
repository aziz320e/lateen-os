import type { FastifyInstance } from 'fastify';
import type { AppConfig } from '../../config/index.js';
import type { CacheStore } from '../../infrastructure/cache/redis-cache.js';

export interface PlatformHealthDeps {
  config: AppConfig;
  cache: CacheStore;
}

async function probe(url: string): Promise<'ok' | 'down'> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return response.ok ? 'ok' : 'down';
  } catch {
    return 'down';
  }
}

async function probeCache(cache: CacheStore): Promise<'ok' | 'down'> {
  try {
    await Promise.race([
      cache.set('platform:health:probe', { ts: Date.now() }, 10),
      new Promise((_, reject) => setTimeout(() => reject(new Error('cache probe timeout')), 2000)),
    ]);
    return 'ok';
  } catch {
    return 'down';
  }
}

export function registerPlatformRoutes(app: FastifyInstance, deps: PlatformHealthDeps) {
  app.get('/platform/health', async () => {
    const [businessDna, redis] = await Promise.all([
      probe(`${deps.config.BUSINESS_DNA_BASE_URL}/health`),
      probeCache(deps.cache),
    ]);

    const services = [
      { name: 'product-discovery-service', status: 'ok' as const },
      { name: 'business-dna-service', status: businessDna },
      { name: 'decision-engine', status: 'ok' as const, mode: 'in-process-adapter' },
      { name: 'ai-runtime', status: 'ok' as const, mode: 'in-process-adapter' },
      { name: 'intelligence-engine', status: 'ok' as const, mode: 'in-process-adapter' },
    ];

    const infrastructure = [
      { name: 'redis', status: redis },
      { name: 'nats', status: deps.config.USE_NATS ? 'ok' as const : 'degraded' as const },
      { name: 'postgresql', status: 'ok' as const },
    ];

    const allOk = [...services, ...infrastructure].every((item) => item.status === 'ok');

    return {
      status: allOk ? 'ok' : 'degraded',
      checkedAt: new Date().toISOString(),
      services,
      infrastructure,
    };
  });
}
