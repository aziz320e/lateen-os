import { NextResponse } from 'next/server';
import { gatewayFetch } from '@/lib/api/gateway-server';

export async function GET() {
  try {
    const data = await gatewayFetch<{ routes: unknown[] }>('/gateway/routes');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gateway unavailable' },
      { status: 502 },
    );
  }
}
