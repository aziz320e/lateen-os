export interface PlatformEnv {
  readonly redisUrl: string;
  readonly natsUrl: string;
  readonly otelExporterOtlpEndpoint?: string;
  readonly identityBaseUrl: string;
  readonly businessDnaBaseUrl: string;
  readonly productDiscoveryBaseUrl: string;
  readonly integrationHubBaseUrl: string;
  readonly missionSchedulerBaseUrl: string;
  readonly marketplaceBaseUrl: string;
  readonly provisioningBaseUrl: string;
}

function resolveEnv(env: NodeJS.ProcessEnv, key: string, lateenKey: string, fallback: string): string {
  return env[key] ?? env[lateenKey] ?? fallback;
}

export function loadPlatformEnv(env: NodeJS.ProcessEnv = process.env): PlatformEnv {
  return {
    redisUrl: resolveEnv(env, 'REDIS_URL', 'LATEEN_REDIS_URL', 'redis://:lateen_dev_redis@localhost:6379/8'),
    natsUrl: resolveEnv(env, 'NATS_URL', 'LATEEN_NATS_URL', 'nats://localhost:4222'),
    otelExporterOtlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT,
    identityBaseUrl: resolveEnv(env, 'IDENTITY_BASE_URL', 'LATEEN_IDENTITY_BASE_URL', 'http://localhost:4003'),
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
    integrationHubBaseUrl: resolveEnv(
      env,
      'INTEGRATION_HUB_BASE_URL',
      'LATEEN_INTEGRATION_HUB_BASE_URL',
      'http://localhost:4004',
    ),
    missionSchedulerBaseUrl: resolveEnv(
      env,
      'MISSION_SCHEDULER_BASE_URL',
      'LATEEN_MISSION_SCHEDULER_BASE_URL',
      'http://localhost:4005',
    ),
    marketplaceBaseUrl: resolveEnv(
      env,
      'MARKETPLACE_BASE_URL',
      'LATEEN_MARKETPLACE_BASE_URL',
      'http://localhost:4006',
    ),
    provisioningBaseUrl: resolveEnv(
      env,
      'PROVISIONING_BASE_URL',
      'LATEEN_PROVISIONING_BASE_URL',
      'http://localhost:4007',
    ),
  };
}
