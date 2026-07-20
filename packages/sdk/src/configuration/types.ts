/** @module configuration/types */
import { z } from 'zod';

export const environmentSchema = z.enum(['development', 'staging', 'production', 'test']);

export const featureFlagsSchema = z.record(z.boolean());

export const sdkConfigInputSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/),
  environment: environmentSchema.default('development'),
  variables: z.record(z.string()).default({}),
  featureFlags: featureFlagsSchema.default({}),
});

export type SdkEnvironmentName = z.infer<typeof environmentSchema>;
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;
export type SdkConfigInput = z.infer<typeof sdkConfigInputSchema>;

export interface SdkConfigDefinition extends SdkConfigInput {
  readonly sdkVersion: string;
}
