import { NextResponse } from 'next/server';
import { listProjectsForCustomer } from '@/lib/api/business-dna-server';
import { buildMessages } from '@/lib/api/portal-mappers';
import { PortalAuthError } from '@/lib/auth';

export async function GET() {
  try {
    const projects = await listProjectsForCustomer();
    return NextResponse.json({ messages: buildMessages(projects) });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Messages failed' }, { status });
  }
}
