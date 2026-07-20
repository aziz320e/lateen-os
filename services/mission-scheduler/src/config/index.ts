import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4005),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  NATS_URL: z.string().default(platformDefaults.natsUrl),
  NATS_SUBJECT_PREFIX: z.string().default('lateen.scheduler'),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  AI_PM_BASE_URL: z.string().default(platformDefaults.aiPmBaseUrl),
  INTEGRATION_HUB_BASE_URL: z.string().default(platformDefaults.integrationHubBaseUrl),
  LATEEN_ASSISTANT_BASE_URL: z.string().default(platformDefaults.lateenAssistantBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('mission-scheduler'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_REDIS: z.string().transform((v) => v === 'true').default('true'),
  USE_NATS: z.string().transform((v) => v === 'true').default('true'),
  CORS_ORIGIN: z.string().default('*'),
  DEFAULT_ORGANIZATION_ID: z.string().default('00000000-0000-4000-8000-000000000001'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Riyadh'),
  MAX_RETRY_ATTEMPTS: z.coerce.number().default(3),
  DEFAULT_SLA_MINUTES: z.coerce.number().default(60),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const platform = loadPlatformEnv(env);
  return configSchema.parse({
    ...env,
    DATABASE_URL: env.DATABASE_URL ?? platform.databaseUrl,
    REDIS_URL: env.REDIS_URL ?? platform.redisUrl,
    NATS_URL: env.NATS_URL ?? platform.natsUrl,
    BUSINESS_DNA_BASE_URL: env.BUSINESS_DNA_BASE_URL ?? platform.businessDnaBaseUrl,
    AI_PM_BASE_URL: env.AI_PM_BASE_URL ?? platform.aiPmBaseUrl,
    INTEGRATION_HUB_BASE_URL: env.INTEGRATION_HUB_BASE_URL ?? platform.integrationHubBaseUrl,
    LATEEN_ASSISTANT_BASE_URL: env.LATEEN_ASSISTANT_BASE_URL ?? platform.lateenAssistantBaseUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
