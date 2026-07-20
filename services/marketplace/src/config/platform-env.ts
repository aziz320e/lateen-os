/**
 * Shared Lateen OS platform environment resolution.
 */

export interface PlatformEnv {
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly identityBaseUrl: string;
}

function resolveEnv(env: NodeJS.ProcessEnv, key: string, lateenKey: string, fallback: string): string {
  return env[key] ?? env[lateenKey] ?? fallback;
}

export function loadPlatformEnv(env: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return {
    databaseUrl: resolveEnv(
      env,
      'DATABASE_URL',
      'LATEEN_DATABASE_URL',
      'postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_marketplace',
    ),
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/6'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    identityBaseUrl: resolveEnv(
      env,
      'IDENTITY_BASE_URL',
      'LATEEN_IDENTITY_BASE_URL',
      'http://localhost:4003',
    ),
  };
}
