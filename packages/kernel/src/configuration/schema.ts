/** @module configuration/schema */
import { z } from 'zod';

export const kernelEnvironmentSchema = z.enum(['development', 'staging', 'production', 'test']);

export const kernelConfigSchema = z.object({
  environment: kernelEnvironmentSchema.default('development'),
  workspaceRoot: z.string().min(1),
  envFile: z.string().optional(),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  telemetryEnabled: z.boolean().default(true),
  otlpEndpoint: z.string().url().default('http://localhost:4318'),
  infraEnabled: z.boolean().default(true),
  gracefulShutdownMs: z.number().int().positive().default(30_000),
  healthCheckTimeoutMs: z.number().int().positive().default(3_000),
  stateDir: z.string().default('.lateen'),
});

export type KernelConfig = z.infer<typeof kernelConfigSchema>;
export type KernelEnvironment = z.infer<typeof kernelEnvironmentSchema>;
