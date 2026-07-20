/** @module configuration/loader */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { kernelConfigSchema, type KernelConfig } from './schema.js';

function parseEnvFile(filePath: string): Record<string, string> {
  if (!existsSync(filePath)) return {};

  const content = readFileSync(filePath, 'utf8');
  const values: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
    values[key] = value;
  }

  return values;
}

export interface LoadConfigOptions {
  readonly workspaceRoot: string;
  readonly env?: NodeJS.ProcessEnv;
}

export function loadKernelConfig(options: LoadConfigOptions): KernelConfig {
  const env = options.env ?? process.env;
  const envFile =
    env.LATEEN_ENV_FILE ??
    join(options.workspaceRoot, 'infrastructure/environments/.env.development');

  const fileValues = parseEnvFile(envFile);

  const merged = {
    environment: env.LATEEN_ENV ?? fileValues.LATEEN_ENV ?? 'development',
    workspaceRoot: options.workspaceRoot,
    envFile,
    logLevel: env.LATEEN_LOG_LEVEL ?? 'info',
    telemetryEnabled: (env.LATEEN_TELEMETRY_ENABLED ?? 'true') !== 'false',
    otlpEndpoint:
      env.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT ??
      fileValues.LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT ??
      'http://localhost:4318',
    infraEnabled: (env.LATEEN_INFRA_ENABLED ?? 'true') !== 'false',
    gracefulShutdownMs: Number(env.LATEEN_GRACEFUL_SHUTDOWN_MS ?? 30_000),
    healthCheckTimeoutMs: Number(env.LATEEN_HEALTH_CHECK_TIMEOUT_MS ?? 3_000),
    stateDir: env.LATEEN_STATE_DIR ?? '.lateen',
  };

  return kernelConfigSchema.parse(merged);
}

export function loadEnvFileValues(workspaceRoot: string, envFile?: string): Record<string, string> {
  const resolved =
    envFile ?? join(workspaceRoot, 'infrastructure/environments/.env.development');
  return parseEnvFile(resolved);
}
