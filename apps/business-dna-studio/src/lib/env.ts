import { z } from 'zod';

const envSchema = z.object({
  LATEEN_ORG_ID: z.string().default('00000000-0000-4000-8000-000000000001'),
  LATEEN_AUTH_SUBJECT: z.string().default('business-dna-studio'),
  KEYCLOAK_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL: z.string().default('http://localhost:4001'),
});

export const serverEnv = envSchema.parse(process.env);

export const publicEnv = {
  businessDnaBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL,
  organizationId: serverEnv.LATEEN_ORG_ID,
};
