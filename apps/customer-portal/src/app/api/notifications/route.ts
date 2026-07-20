import { NextResponse } from 'next/server';
import {
  listInvoicesForCustomer,
  listOrdersForCustomer,
  listProjectsForCustomer,
  listQuotationsForCustomer,
} from '@/lib/api/business-dna-server';
import { buildNotifications } from '@/lib/api/portal-mappers';
import { PortalAuthError } from '@/lib/auth';

export async function GET() {
  try {
    const [projects, quotations, orders, invoices] = await Promise.all([
      listProjectsForCustomer(),
      listQuotationsForCustomer(),
      listOrdersForCustomer(),
      listInvoicesForCustomer(),
    ]);
    return NextResponse.json({ notifications: buildNotifications(projects, quotations, orders, invoices) });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Notifications failed' }, { status });
  }
}
