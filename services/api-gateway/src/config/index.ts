import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4008),
  HOST: z.string().default('0.0.0.0'),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  NATS_URL: z.string().default(platformDefaults.natsUrl),
  IDENTITY_BASE_URL: z.string().default(platformDefaults.identityBaseUrl),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  PRODUCT_DISCOVERY_BASE_URL: z.string().default(platformDefaults.productDiscoveryBaseUrl),
  INTEGRATION_HUB_BASE_URL: z.string().default(platformDefaults.integrationHubBaseUrl),
  MISSION_SCHEDULER_BASE_URL: z.string().default(platformDefaults.missionSchedulerBaseUrl),
  MARKETPLACE_BASE_URL: z.string().default(platformDefaults.marketplaceBaseUrl),
  PROVISIONING_BASE_URL: z.string().default(platformDefaults.provisioningBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('api-gateway'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_REDIS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  USE_NATS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_SECRET: z.string().optional(),
  MAX_REQUEST_BYTES: z.coerce.number().default(10 * 1024 * 1024),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30_000),
  RETRY_ATTEMPTS: z.coerce.number().default(2),
  RETRY_DELAY_MS: z.coerce.number().default(250),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().default(600),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const platform = loadPlatformEnv(env);
  return configSchema.parse({
    ...env,
    REDIS_URL: env.REDIS_URL ?? platform.redisUrl,
    NATS_URL: env.NATS_URL ?? platform.natsUrl,
    IDENTITY_BASE_URL: env.IDENTITY_BASE_URL ?? platform.identityBaseUrl,
    BUSINESS_DNA_BASE_URL: env.BUSINESS_DNA_BASE_URL ?? platform.businessDnaBaseUrl,
    PRODUCT_DISCOVERY_BASE_URL: env.PRODUCT_DISCOVERY_BASE_URL ?? platform.productDiscoveryBaseUrl,
    INTEGRATION_HUB_BASE_URL: env.INTEGRATION_HUB_BASE_URL ?? platform.integrationHubBaseUrl,
    MISSION_SCHEDULER_BASE_URL: env.MISSION_SCHEDULER_BASE_URL ?? platform.missionSchedulerBaseUrl,
    MARKETPLACE_BASE_URL: env.MARKETPLACE_BASE_URL ?? platform.marketplaceBaseUrl,
    PROVISIONING_BASE_URL: env.PROVISIONING_BASE_URL ?? platform.provisioningBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
