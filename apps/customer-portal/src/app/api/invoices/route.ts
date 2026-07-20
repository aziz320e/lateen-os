import { NextResponse } from 'next/server';
import { getInvoiceForCustomer, listInvoicesForCustomer } from '@/lib/api/business-dna-server';
import { PortalAuthError } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      return NextResponse.json({ invoice: await getInvoiceForCustomer(id) });
    }
    return NextResponse.json({ invoices: await listInvoicesForCustomer() });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invoices failed' }, { status });
  }
}
