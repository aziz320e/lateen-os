import { z } from 'zod';

const envSchema = z.object({
  LATEEN_ORG_ID: z.string().default('00000000-0000-4000-8000-000000000001'),
  NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL: z.string().default('http://localhost:4006'),
});

export const serverEnv = envSchema.parse(process.env);

export const publicEnv = {
  marketplaceBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL,
  organizationId: serverEnv.LATEEN_ORG_ID,
};
