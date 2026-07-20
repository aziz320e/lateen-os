import { NextResponse } from 'next/server';
import { getAccessToken, getCustomerIdCookie, PortalAuthError } from '@/lib/auth';
import { identityMe } from '@/lib/api/identity-server';
import { getCustomerProfile } from '@/lib/api/business-dna-server';
import { serverEnv } from '@/lib/env';

export async function GET() {
  try {
    const customerId = await getCustomerIdCookie();
    const accessToken = await getAccessToken();

    if (accessToken) {
      const user = await identityMe(accessToken);
      const profile = customerId ? await getCustomerProfile(customerId).catch(() => null) : null;
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          organizationId: user.organizationId,
          customerId,
          roles: user.roles ?? [],
        },
        customer: profile,
      });
    }

    if (customerId) {
      const profile = await getCustomerProfile(customerId).catch(() => null);
      return NextResponse.json({
        user: {
          id: 'dev-user',
          email: 'dev@customer.local',
          username: serverEnv.LATEEN_AUTH_SUBJECT,
          displayName: 'Dev Customer',
          organizationId: serverEnv.LATEEN_ORG_ID,
          customerId,
          roles: ['customer'],
        },
        customer: profile,
      });
    }

    throw new PortalAuthError('Not authenticated');
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 401;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unauthorized' }, { status });
  }
}
