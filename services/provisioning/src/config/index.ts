import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4007),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  IDENTITY_BASE_URL: z.string().default(platformDefaults.identityBaseUrl),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  MARKETPLACE_BASE_URL: z.string().default(platformDefaults.marketplaceBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('provisioning'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_REDIS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  CORS_ORIGIN: z.string().default('*'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const platform = loadPlatformEnv(env);
  return configSchema.parse({
    ...env,
    DATABASE_URL: env.DATABASE_URL ?? platform.databaseUrl,
    REDIS_URL: env.REDIS_URL ?? platform.redisUrl,
    IDENTITY_BASE_URL: env.IDENTITY_BASE_URL ?? platform.identityBaseUrl,
    BUSINESS_DNA_BASE_URL: env.BUSINESS_DNA_BASE_URL ?? platform.businessDnaBaseUrl,
    MARKETPLACE_BASE_URL: env.MARKETPLACE_BASE_URL ?? platform.marketplaceBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
