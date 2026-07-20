export interface PlatformEnv {
  readonly redisUrl: string;
  readonly qdrantUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly businessDnaBaseUrl: string;
  readonly knowledgePlatformBaseUrl: string;
  readonly marketplaceBaseUrl: string;
  readonly aiProviderHubBaseUrl: string;
}

function resolveEnv(env: NodeJS.ProcessEnv, key: string, lateenKey: string, fallback: string): string {
  return env[key] ?? env[lateenKey] ?? fallback;
}

export function loadPlatformEnv(env: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return {
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/10'),
    qdrantUrl: resolveEnv(env, 'QDRANT_URL', 'LATEEN_QDRANT_URL', 'http://localhost:6333'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    businessDnaBaseUrl: resolveEnv(env, 'BUSINESS_DNA_BASE_URL', 'LATEEN_BUSINESS_DNA_BASE_URL', 'http://localhost:4001'),
    knowledgePlatformBaseUrl: resolveEnv(
      env,
      'KNOWLEDGE_PLATFORM_BASE_URL',
      'LATEEN_KNOWLEDGE_PLATFORM_BASE_URL',
      'http://localhost:4009',
    ),
    marketplaceBaseUrl: resolveEnv(env, 'MARKETPLACE_BASE_URL', 'LATEEN_MARKETPLACE_BASE_URL', 'http://localhost:4006'),
    aiProviderHubBaseUrl: resolveEnv(
      env,
      'AI_PROVIDER_HUB_BASE_URL',
      'LATEEN_AI_PROVIDER_HUB_BASE_URL',
      'http://localhost:4008',
    ),
  };
}
