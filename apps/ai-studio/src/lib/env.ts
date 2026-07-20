import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_WORKFORCE_BASE_URL: z.string().default('http://localhost:4008'),
  NEXT_PUBLIC_LATEEN_SEARCH_BASE_URL: z.string().default('http://localhost:4010'),
  NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL: z.string().default('http://localhost:4006'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = {
  workforceBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_WORKFORCE_BASE_URL,
  searchBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_SEARCH_BASE_URL,
  marketplaceBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL,
};
