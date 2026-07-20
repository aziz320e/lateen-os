import { NextResponse } from 'next/server';
import { getDiscoveryRun } from '@/lib/api/discovery-server';

export async function GET(_request: Request, context: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await context.params;
    const run = await getDiscoveryRun(runId);
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get run' },
      { status: 502 },
    );
  }
}
