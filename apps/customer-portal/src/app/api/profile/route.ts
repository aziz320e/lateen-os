import { NextResponse } from 'next/server';
import { getCustomerProfile } from '@/lib/api/business-dna-server';
import { getAccessToken, getCustomerIdCookie, PortalAuthError } from '@/lib/auth';
import { identityMe } from '@/lib/api/identity-server';
import { serverEnv } from '@/lib/env';

export async function GET() {
  try {
    const customerId = await getCustomerIdCookie();
    if (!customerId) throw new PortalAuthError('Not authenticated');
    const customer = await getCustomerProfile(customerId);
    const accessToken = await getAccessToken();
    const user = accessToken
      ? await identityMe(accessToken)
      : {
          id: 'dev-user',
          email: customer.email ?? 'dev@customer.local',
          username: serverEnv.LATEEN_AUTH_SUBJECT,
          displayName: customer.name,
          organizationId: serverEnv.LATEEN_ORG_ID,
          roles: ['customer'],
        };
    return NextResponse.json({ customer, user: { ...user, customerId } });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Profile failed' }, { status });
  }
}
