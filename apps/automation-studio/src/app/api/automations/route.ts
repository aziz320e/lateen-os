import { NextResponse } from 'next/server';
import { MOCK_AUTOMATIONS } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(MOCK_AUTOMATIONS);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ ...body, id: `auto-${Date.now()}`, version: 1, status: 'draft', updatedAt: new Date().toISOString() }, { status: 201 });
}
