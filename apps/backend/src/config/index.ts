import { z } from 'zod';

/** Configuration Loader — a single, validated source of truth for this host's runtime configuration. */
export const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4013),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('*'),
  PLATFORM_NAME: z.string().default('Lateen OS'),

  // Database Configuration (Phase 4 Task 2)
  DATABASE_URL: z.string().default('postgresql://localhost:5432/lateen_os_backend'),

  // Authentication & Authorization (Phase 4 Task 3)
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-in-production'),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(900),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().default(1_209_600),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
  COOKIE_SECURE: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
});

export type AppConfig = z.infer<typeof configSchema>;

const INSECURE_DEV_DEFAULTS = new Set([
  'dev-access-secret-change-in-production',
  'dev-refresh-secret-change-in-production',
]);

/**
 * Production safety gate — fails fast at startup rather than silently
 * running with insecure defaults. Every value checked here has a
 * permissive default so local development and this platform's own
 * sandboxed tests never need extra configuration; only `NODE_ENV=production`
 * enforces them.
 */
function assertProductionSafe(config: AppConfig): void {
  if (config.NODE_ENV !== 'production') return;

  const problems: string[] = [];
  if (INSECURE_DEV_DEFAULTS.has(config.JWT_ACCESS_SECRET))
    problems.push('JWT_ACCESS_SECRET is still the development default');
  if (INSECURE_DEV_DEFAULTS.has(config.JWT_REFRESH_SECRET))
    problems.push('JWT_REFRESH_SECRET is still the development default');
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET)
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different secrets');
  if (config.CORS_ORIGIN === '*')
    problems.push('CORS_ORIGIN must not be "*" in production — set explicit allowed origin(s)');
  if (!config.COOKIE_SECURE)
    problems.push('COOKIE_SECURE must be "true" in production (cookies are sent over TLS only)');

  if (problems.length > 0) {
    throw new Error(
      `Refusing to start with NODE_ENV=production and insecure configuration:\n  - ${problems.join('\n  - ')}`,
    );
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const config = configSchema.parse(env);
  // `prisma/schema.prisma` reads `DATABASE_URL` directly from `process.env`
  // via its own `env("DATABASE_URL")` — independent of this zod-parsed
  // config object — so the default above must also be written back for
  // Prisma (and any other env-driven tool) to actually see it.
  process.env.DATABASE_URL ??= config.DATABASE_URL;
  assertProductionSafe(config);
  return config;
}
