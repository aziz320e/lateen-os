import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_SEARCH_BASE_URL: z.string().default('http://localhost:4010'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = { searchBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_SEARCH_BASE_URL };
