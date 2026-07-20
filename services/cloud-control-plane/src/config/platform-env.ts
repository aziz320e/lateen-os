export interface PlatformEnv {
  readonly redisUrl: string;
  readonly databaseUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly provisioningBaseUrl: string;
  readonly identityBaseUrl: string;
  readonly marketplaceBaseUrl: string;
  readonly analyticsBaseUrl: string;
}

function resolveEnv(env: NodeJS.ProcessEnv, key: string, lateenKey: string, fallback: string): string {
  return env[key] ?? env[lateenKey] ?? fallback;
}

export function loadPlatformEnv(env: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return {
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/12'),
    databaseUrl: resolveEnv(env, 'DATABASE_URL', 'LATEEN_DATABASE_URL', 'postgresql://lateen:lateen_dev@localhost:5432/lateen_cloud'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    provisioningBaseUrl: resolveEnv(env, 'PROVISIONING_BASE_URL', 'LATEEN_PROVISIONING_BASE_URL', 'http://localhost:4005'),
    identityBaseUrl: resolveEnv(env, 'IDENTITY_BASE_URL', 'LATEEN_IDENTITY_BASE_URL', 'http://localhost:4002'),
    marketplaceBaseUrl: resolveEnv(env, 'MARKETPLACE_BASE_URL', 'LATEEN_MARKETPLACE_BASE_URL', 'http://localhost:4006'),
    analyticsBaseUrl: resolveEnv(env, 'ANALYTICS_BASE_URL', 'LATEEN_ANALYTICS_BASE_URL', 'http://localhost:4011'),
  };
}
