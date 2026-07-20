import { NextResponse } from 'next/server';
import { getQuotationForCustomer, listQuotationsForCustomer } from '@/lib/api/business-dna-server';
import { getAuthHeaders, PortalAuthError, requireCustomerId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (id) {
      return NextResponse.json({ quotation: await getQuotationForCustomer(id) });
    }
    return NextResponse.json({ quotations: await listQuotationsForCustomer() });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Quotations failed' }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { quotationId, action } = (await request.json()) as { quotationId: string; action: 'approve' | 'reject' };
    await requireCustomerId();
    const quotation = await getQuotationForCustomer(quotationId);
    if (quotation.status !== 'sent') {
      return NextResponse.json({ error: 'Quotation is not pending approval' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'accepted' : 'rejected';
    const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;
    const response = await fetch(
      `${baseUrl}/api/v1/organizations/${serverEnv.LATEEN_ORG_ID}/quotations/${quotationId}`,
      {
        method: 'PUT',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ ...quotation, status: newStatus, acceptedAt: action === 'approve' ? new Date().toISOString() : undefined }),
      },
    );
    if (!response.ok) {
      return NextResponse.json({ error: 'Approval update failed' }, { status: 502 });
    }
    const updated = await response.json();
    return NextResponse.json({ quotation: updated });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Approval failed' }, { status });
  }
}
