import { describe, expect, it } from 'vitest';
import { PortalAuthError } from '@/lib/auth';

describe('authentication errors', () => {
  it('PortalAuthError has status code', () => {
    const err = new PortalAuthError('Unauthorized', 401);
    expect(err.status).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('PortalAuthError defaults to 401', () => {
    expect(new PortalAuthError('Forbidden').status).toBe(401);
  });
});
