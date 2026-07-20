import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_CLOUD_BASE_URL: z.string().default('http://localhost:4012'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = { cloudBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_CLOUD_BASE_URL };
