/** Synced with infrastructure/platform/env.ts — shared platform environment loader. */

export interface PlatformEnv {
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly natsUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly businessDnaBaseUrl: string;
  readonly productDiscoveryBaseUrl: string;
}

export function resolveEnv(env: NodeJS.ProcessEnv, key: string, lateenKey: string, fallback: string): string {
  return env[key] ?? env[lateenKey] ?? fallback;
}

export function loadPlatformEnv(env: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return {
    databaseUrl: resolveEnv(
      env,
      'DATABASE_URL',
      'LATEEN_DATABASE_URL',
      'postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_os',
    ),
    redisUrl: resolveEnv(
      env,
      'REDIS_URL',
      'LATEEN_REDIS_URL',
      'redis://:lateen_dev_redis@localhost:6379/0',
    ),
    natsUrl: resolveEnv(env, 'NATS_URL', 'LATEEN_NATS_URL', 'nats://localhost:4222'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    businessDnaBaseUrl: resolveEnv(
      env,
      'BUSINESS_DNA_BASE_URL',
      'LATEEN_BUSINESS_DNA_BASE_URL',
      'http://localhost:4001',
    ),
    productDiscoveryBaseUrl: resolveEnv(
      env,
      'PRODUCT_DISCOVERY_BASE_URL',
      'LATEEN_PRODUCT_DISCOVERY_BASE_URL',
      'http://localhost:4002',
    ),
  };
}
