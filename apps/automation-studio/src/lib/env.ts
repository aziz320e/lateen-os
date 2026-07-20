import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_LATEEN_WORKFLOW_BASE_URL: z.string().default('http://localhost:4008'),
  NEXT_PUBLIC_LATEEN_MISSION_BASE_URL: z.string().default('http://localhost:4008'),
  NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL: z.string().default('http://localhost:4006'),
});

export const serverEnv = envSchema.parse(process.env);
export const publicEnv = {
  workflowBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_WORKFLOW_BASE_URL,
  missionBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_MISSION_BASE_URL,
  marketplaceBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL,
};
