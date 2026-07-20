import { NextResponse } from 'next/server';
import { MOCK_WORKERS } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(MOCK_WORKERS);
}

export async function POST(request: Request) {
  const body = await request.json();
  const worker = { ...body, id: `worker-${Date.now()}`, version: 1, status: 'draft', updatedAt: new Date().toISOString() };
  return NextResponse.json(worker, { status: 201 });
}
