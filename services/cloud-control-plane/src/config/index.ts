import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4012),
  HOST: z.string().default('0.0.0.0'),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  PROVISIONING_BASE_URL: z.string().default(platformDefaults.provisioningBaseUrl),
  IDENTITY_BASE_URL: z.string().default(platformDefaults.identityBaseUrl),
  MARKETPLACE_BASE_URL: z.string().default(platformDefaults.marketplaceBaseUrl),
  ANALYTICS_BASE_URL: z.string().default(platformDefaults.analyticsBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('cloud-control-plane'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_REDIS: z.string().transform((v) => v === 'true').default('true'),
  CORS_ORIGIN: z.string().default('*'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const platform = loadPlatformEnv(env);
  return configSchema.parse({
    ...env,
    REDIS_URL: env.REDIS_URL ?? platform.redisUrl,
    DATABASE_URL: env.DATABASE_URL ?? platform.databaseUrl,
    PROVISIONING_BASE_URL: env.PROVISIONING_BASE_URL ?? platform.provisioningBaseUrl,
    IDENTITY_BASE_URL: env.IDENTITY_BASE_URL ?? platform.identityBaseUrl,
    MARKETPLACE_BASE_URL: env.MARKETPLACE_BASE_URL ?? platform.marketplaceBaseUrl,
    ANALYTICS_BASE_URL: env.ANALYTICS_BASE_URL ?? platform.analyticsBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
