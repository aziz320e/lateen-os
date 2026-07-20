import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4011),
  HOST: z.string().default('0.0.0.0'),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  SEARCH_PLATFORM_BASE_URL: z.string().default(platformDefaults.searchPlatformBaseUrl),
  KNOWLEDGE_PLATFORM_BASE_URL: z.string().default(platformDefaults.knowledgePlatformBaseUrl),
  MARKETPLACE_BASE_URL: z.string().default(platformDefaults.marketplaceBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('analytics-platform'),
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
    BUSINESS_DNA_BASE_URL: env.BUSINESS_DNA_BASE_URL ?? platform.businessDnaBaseUrl,
    SEARCH_PLATFORM_BASE_URL: env.SEARCH_PLATFORM_BASE_URL ?? platform.searchPlatformBaseUrl,
    KNOWLEDGE_PLATFORM_BASE_URL: env.KNOWLEDGE_PLATFORM_BASE_URL ?? platform.knowledgePlatformBaseUrl,
    MARKETPLACE_BASE_URL: env.MARKETPLACE_BASE_URL ?? platform.marketplaceBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
