import { NextResponse } from 'next/server';
import { listOrdersForCustomer, listQuotationsForCustomer } from '@/lib/api/business-dna-server';
import { buildApprovals, buildProductionViews } from '@/lib/api/portal-mappers';
import { PortalAuthError } from '@/lib/auth';

export async function GET() {
  try {
    const [quotations, orders] = await Promise.all([listQuotationsForCustomer(), listOrdersForCustomer()]);
    return NextResponse.json({
      approvals: buildApprovals(quotations),
      production: buildProductionViews(orders),
    });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Approvals failed' }, { status });
  }
}
