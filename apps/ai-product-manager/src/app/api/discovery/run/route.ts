import { NextResponse } from 'next/server';
import { runDiscovery } from '@/lib/api/discovery-server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { keywords?: string[] };
    const keywords = body.keywords ?? ['signage'];
    const run = await runDiscovery(keywords, 'product-manager-ai');
    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 502 },
    );
  }
}
