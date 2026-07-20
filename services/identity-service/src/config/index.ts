import { z } from 'zod';
import { loadPlatformEnv } from './platform-env';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4003),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  REDIS_URL: z.string().default(platformDefaults.redisUrl),
  NATS_URL: z.string().default(platformDefaults.natsUrl),
  NATS_SUBJECT_PREFIX: z.string().default('lateen.identity'),
  BUSINESS_DNA_BASE_URL: z.string().default(platformDefaults.businessDnaBaseUrl),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('identity-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_REDIS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  USE_NATS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  JWT_SECRET: z.string().min(16).default('dev-jwt-secret-change-in-prod'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().default(900),
  JWT_REFRESH_TTL_SECONDS: z.coerce.number().default(604800),
  JWT_REMEMBER_ME_TTL_SECONDS: z.coerce.number().default(2592000),
  KEYCLOAK_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  KEYCLOAK_REALM: z.string().default('lateen'),
  KEYCLOAK_CLIENT_ID: z.string().default('identity-service'),
  KEYCLOAK_CLIENT_SECRET: z.string().default(''),
  KEYCLOAK_ISSUER_URL: z.string().default('http://localhost:8080/realms/lateen'),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCKOUT_DURATION_SECONDS: z.coerce.number().default(900),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().default(60),
  PASSWORD_MIN_LENGTH: z.coerce.number().default(8),
  ALLOWED_IP_CIDRS: z.string().default(''),
  CORS_ORIGIN: z.string().default('*'),
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
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
