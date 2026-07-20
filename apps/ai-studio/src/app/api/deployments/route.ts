import { NextResponse } from 'next/server';
import { MOCK_DEPLOYMENTS } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(MOCK_DEPLOYMENTS);
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    id: `dep-${Date.now()}`,
    ...body,
    status: 'published',
    publishedAt: new Date().toISOString(),
    version: body.version ?? 1,
  }, { status: 201 });
}
