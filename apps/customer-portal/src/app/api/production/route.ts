import { NextResponse } from 'next/server';
import { listOrdersForCustomer } from '@/lib/api/business-dna-server';
import { buildProductionViews } from '@/lib/api/portal-mappers';
import { PortalAuthError } from '@/lib/auth';

export async function GET() {
  try {
    const orders = await listOrdersForCustomer();
    return NextResponse.json({ production: buildProductionViews(orders) });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Production failed' }, { status });
  }
}
