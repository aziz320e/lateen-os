import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_GATEWAY_BASE_URL: z.string().default('http://localhost:4008'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = { gatewayBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_GATEWAY_BASE_URL };
