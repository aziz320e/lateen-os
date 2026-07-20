import { serverEnv } from './env';

export function getDevBearerToken(): string {
  return `Bearer dev:${serverEnv.LATEEN_ORG_ID}:${serverEnv.LATEEN_AUTH_SUBJECT}`;
}

export function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: getDevBearerToken(),
    'X-Organization-Id': serverEnv.LATEEN_ORG_ID,
    'Content-Type': 'application/json',
  };
}

export function getOrganizationId(): string {
  return serverEnv.LATEEN_ORG_ID;
}

export function getAuthSubject(): string {
  return serverEnv.LATEEN_AUTH_SUBJECT;
}
