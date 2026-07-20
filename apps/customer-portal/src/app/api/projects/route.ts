import { NextResponse } from 'next/server';
import { getProjectForCustomer, listProjectsForCustomer } from '@/lib/api/business-dna-server';
import { PortalAuthError } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const project = await getProjectForCustomer(id);
      return NextResponse.json({ project });
    }
    const projects = await listProjectsForCustomer();
    return NextResponse.json({ projects });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : error instanceof Error && error.message === 'Access denied' ? 403 : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Projects failed' }, { status });
  }
}
