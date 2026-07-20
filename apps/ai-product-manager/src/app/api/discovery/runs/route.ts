import { NextResponse } from 'next/server';
import { listDiscoveryRuns, runDiscovery } from '@/lib/api/discovery-server';

export async function GET() {
  try {
    const runs = await listDiscoveryRuns();
    return NextResponse.json(runs);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list runs' },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { keywords?: string[] };
    const keywords = body.keywords ?? ['signage', 'vehicle wrap'];
    const run = await runDiscovery(keywords, 'product-manager-ai');
    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run discovery' },
      { status: 502 },
    );
  }
}
