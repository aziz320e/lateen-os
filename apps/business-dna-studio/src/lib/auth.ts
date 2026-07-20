import { serverEnv } from './env';

export function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer dev:${serverEnv.LATEEN_ORG_ID}:${serverEnv.LATEEN_AUTH_SUBJECT}`,
    'X-Organization-Id': serverEnv.LATEEN_ORG_ID,
    'Content-Type': 'application/json',
  };
}

export function getOrganizationId(): string {
  return serverEnv.LATEEN_ORG_ID;
}
