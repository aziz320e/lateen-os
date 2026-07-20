import { z } from 'zod';

const envSchema = z.object({
  LATEEN_ORG_ID: z.string().default('00000000-0000-4000-8000-000000000001'),
  LATEEN_CUSTOMER_ID: z.string().optional(),
  LATEEN_AUTH_SUBJECT: z.string().default('customer-portal'),
  KEYCLOAK_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL: z.string().default('http://localhost:4001'),
  NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL: z.string().default('http://localhost:4003'),
  AUTH_COOKIE_NAME: z.string().default('lateen_portal_access'),
  AUTH_REFRESH_COOKIE_NAME: z.string().default('lateen_portal_refresh'),
  AUTH_CUSTOMER_COOKIE_NAME: z.string().default('lateen_portal_customer'),
  AUTH_COOKIE_SECURE: z.string().transform((v) => v === 'true').default('false'),
});

export const serverEnv = envSchema.parse(process.env);

export const publicEnv = {
  businessDnaBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL,
  identityBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL,
  organizationId: serverEnv.LATEEN_ORG_ID,
};
