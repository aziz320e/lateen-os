import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_PROVISIONING_BASE_URL: z.string().default('http://localhost:4007'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = { provisioningBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_PROVISIONING_BASE_URL };
