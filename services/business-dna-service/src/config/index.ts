import { z } from 'zod';
import { loadPlatformEnv } from './platform-env.js';

const platformDefaults = loadPlatformEnv();

export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4001),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().default(platformDefaults.databaseUrl),
  NATS_URL: z.string().default(platformDefaults.natsUrl),
  NATS_SUBJECT_PREFIX: z.string().default('lateen.business-dna'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('business-dna-service'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  USE_NATS: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
  KEYCLOAK_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  KEYCLOAK_REALM: z.string().default('lateen'),
  KEYCLOAK_CLIENT_ID: z.string().default('business-dna-service'),
  KEYCLOAK_ISSUER_URL: z.string().default('http://localhost:8080/realms/lateen'),
  CORS_ORIGIN: z.string().default('*'),
});

export type AppConfig = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const platform = loadPlatformEnv(env);
  return configSchema.parse({
    ...env,
    DATABASE_URL: env.DATABASE_URL ?? platform.databaseUrl,
    NATS_URL: env.NATS_URL ?? platform.natsUrl,
    OTEL_EXPORTER_OTLP_ENDPOINT: env.OTEL_EXPORTER_OTLP_ENDPOINT ?? platform.otelExporterOtlpEndpoint,
  });
}
