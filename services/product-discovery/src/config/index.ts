import { z } from 'zod';
import { loadPlatformEnv } from './platform-env.js';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4002),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  NATS_URL: z.string().default(platformDefaults.natsUrl),
  NATS_SUBJECT_PREFIX: z.string().default('lateen.product_discovery'),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('product-discovery-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  USE_REDIS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  USE_NATS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const merged = { ...loadPlatformEnv(env), ...env };
  const nodeEnv = env.NODE_ENV ?? 'development';
  return configSchema.parse({
    ...merged,
    NODE_ENV: nodeEnv,
    DATABASE_URL: env.DATABASE_URL ?? merged.databaseUrl,
    REDIS_URL: env.REDIS_URL ?? merged.redisUrl,
    NATS_URL: env.NATS_URL ?? merged.natsUrl,
    BUSINESS_DNA_BASE_URL: env.BUSINESS_DNA_BASE_URL ?? merged.businessDnaBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? merged.otelExporterOtlpEndpoint,
    USE_REDIS: env.USE_REDIS ?? (nodeEnv === 'test' ? 'false' : 'true'),
    USE_NATS: env.USE_NATS ?? (nodeEnv === 'test' ? 'false' : 'true'),
  });
}
