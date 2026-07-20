import { NextResponse } from 'next/server';
import { MOCK_MARKETPLACE } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(MOCK_MARKETPLACE);
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === 'publish') return NextResponse.json({ published: true, listingId: `mp-${Date.now()}` });
  if (body.action === 'install') return NextResponse.json({ installed: true, automationId: `auto-${body.listingId}` });
  if (body.action === 'clone') return NextResponse.json({ cloned: true, automationId: `auto-clone-${Date.now()}` });
  return NextResponse.json({ ok: true });
}
