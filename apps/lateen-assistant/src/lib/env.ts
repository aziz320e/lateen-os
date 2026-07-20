import { z } from 'zod';

const envSchema = z.object({
  LATEEN_ORG_ID: z.string().default('00000000-0000-4000-8000-000000000001'),
  LATEEN_AUTH_SUBJECT: z.string().default('lateen-assistant'),
  KEYCLOAK_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  KEYCLOAK_URL: z.string().optional(),
  KEYCLOAK_REALM: z.string().default('lateen'),
  KEYCLOAK_CLIENT_ID: z.string().default('lateen-assistant'),
  NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL: z.string().default('http://localhost:4001'),
  NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL: z.string().default('http://localhost:4002'),
  NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL: z.string().default('http://localhost:4003'),
  NEXT_PUBLIC_LATEEN_INTEGRATION_HUB_BASE_URL: z.string().default('http://localhost:4004'),
  NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_LATEEN_CEO_COCKPIT_BASE_URL: z.string().default('http://localhost:3002'),
  LATEEN_OTEL_EXPORTER_OTLP_ENDPOINT: z.string().default('http://localhost:4318'),
});

export const serverEnv = envSchema.parse(process.env);

export const publicEnv = {
  businessDnaBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL,
  productDiscoveryBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_PRODUCT_DISCOVERY_BASE_URL,
  identityBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_IDENTITY_BASE_URL,
  integrationHubBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_INTEGRATION_HUB_BASE_URL,
  aiPmBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_AI_PM_BASE_URL,
  ceoCockpitBaseUrl: serverEnv.NEXT_PUBLIC_LATEEN_CEO_COCKPIT_BASE_URL,
  organizationId: serverEnv.LATEEN_ORG_ID,
};
