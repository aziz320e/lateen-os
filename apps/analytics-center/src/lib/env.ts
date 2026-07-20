import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_ANALYTICS_BASE_URL: z.string().default('http://localhost:4011'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = { analyticsBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_ANALYTICS_BASE_URL };
