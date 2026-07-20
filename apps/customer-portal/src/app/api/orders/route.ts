import { NextResponse } from 'next/server';
import { getOrderForCustomer, listOrdersForCustomer } from '@/lib/api/business-dna-server';
import { PortalAuthError } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      return NextResponse.json({ order: await getOrderForCustomer(id) });
    }
    return NextResponse.json({ orders: await listOrdersForCustomer() });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Orders failed' }, { status });
  }
}
