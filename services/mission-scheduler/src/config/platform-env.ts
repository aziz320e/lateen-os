/**
 * Shared Lateen OS platform environment resolution.
 */

export interface PlatformEnv {
  readonly databaseUrl: string;
  readonly redisUrl: string;
  readonly natsUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly businessDnaBaseUrl: string;
  readonly aiPmBaseUrl: string;
  readonly integrationHubBaseUrl: string;
  readonly lateenAssistantBaseUrl: string;
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
      'postgresql://lateen:lateen_dev_postgres@localhost:5432/lateen_mission_scheduler',
    ),
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/3'),
    natsUrl: resolveEnv(env, 'NATS_URL', 'LATEEN_NATS_URL', 'nats://localhost:4222'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    businessDnaBaseUrl: resolveEnv(env, 'BUSINESS_DNA_BASE_URL', 'LATEEN_BUSINESS_DNA_BASE_URL', 'http://localhost:4001'),
    aiPmBaseUrl: resolveEnv(env, 'AI_PM_BASE_URL', 'LATEEN_AI_PM_BASE_URL', 'http://localhost:3000'),
    integrationHubBaseUrl: resolveEnv(env, 'INTEGRATION_HUB_BASE_URL', 'LATEEN_INTEGRATION_HUB_BASE_URL', 'http://localhost:4004'),
    lateenAssistantBaseUrl: resolveEnv(env, 'LATEEN_ASSISTANT_BASE_URL', 'LATEEN_LATEEN_ASSISTANT_BASE_URL', 'http://localhost:3004'),
  };
}
