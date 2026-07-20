export interface PlatformEnv {
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly qdrantUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly businessDnaBaseUrl: string;
  readonly aiProviderHubBaseUrl: string;
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
      'postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_knowledge',
    ),
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/9'),
    qdrantUrl: resolveEnv(env, 'QDRANT_URL', 'LATEEN_QDRANT_URL', 'http://localhost:6333'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    businessDnaBaseUrl: resolveEnv(
      env,
      'BUSINESS_DNA_BASE_URL',
      'LATEEN_BUSINESS_DNA_BASE_URL',
      'http://localhost:4001',
    ),
    aiProviderHubBaseUrl: resolveEnv(
      env,
      'AI_PROVIDER_HUB_BASE_URL',
      'LATEEN_AI_PROVIDER_HUB_BASE_URL',
      'http://localhost:4008',
    ),
  };
}
