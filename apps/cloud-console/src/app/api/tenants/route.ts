import { NextResponse } from 'next/server';
import { cloudFetch } from '@/lib/api/cloud-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const path = organizationId ? `/api/tenants?organizationId=${organizationId}` : '/api/tenants';
  try {
    return NextResponse.json(await cloudFetch(path));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
