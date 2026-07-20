/** @module environment/validator */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import type { KernelConfig } from '../configuration/schema.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';

const requiredEnvKeys = [
  'LATEEN_DATABASE_URL',
  'LATEEN_REDIS_URL',
  'LATEEN_NATS_URL',
] as const;

const envValueSchema = z.object({
  LATEEN_DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')),
  LATEEN_REDIS_URL: z.string().startsWith('redis://'),
  LATEEN_NATS_URL: z.string().startsWith('nats://'),
});

export interface EnvironmentValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface EnvironmentValidationResult {
  readonly valid: boolean;
  readonly issues: readonly EnvironmentValidationIssue[];
}

export function validateEnvironment(
  config: KernelConfig,
  env: NodeJS.ProcessEnv = process.env,
): EnvironmentValidationResult {
  const issues: EnvironmentValidationIssue[] = [];

  if (config.envFile && !existsSync(config.envFile)) {
    issues.push({
      code: 'ENV_FILE_MISSING',
      message: `Environment file not found: ${config.envFile}`,
      severity: 'warning',
    });
  }

  for (const key of requiredEnvKeys) {
    const value = env[key] ?? env[key.replace('LATEEN_', '')];
    if (!value) {
      issues.push({
        code: 'MISSING_ENV',
        message: `Missing required environment variable: ${key}`,
        severity: 'error',
      });
    }
  }

  const candidate = {
    LATEEN_DATABASE_URL: env.LATEEN_DATABASE_URL ?? '',
    LATEEN_REDIS_URL: env.LATEEN_REDIS_URL ?? '',
    LATEEN_NATS_URL: env.LATEEN_NATS_URL ?? '',
  };

  const parsed = envValueSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        code: 'INVALID_ENV',
        message: issue.message,
        severity: 'error',
      });
    }
  }

  for (const service of PLATFORM_MANIFEST.services) {
    const servicePath = join(config.workspaceRoot, service.path);
    if (!existsSync(servicePath)) {
      issues.push({
        code: 'MISSING_SERVICE',
        message: `Registered service path not found: ${service.path}`,
        severity: 'error',
      });
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
  };
}
