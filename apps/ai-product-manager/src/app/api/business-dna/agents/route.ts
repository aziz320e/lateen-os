import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/api/business-dna-server';

export async function GET() {
  try {
    return NextResponse.json(await listAgents());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list agents' },
      { status: 502 },
    );
  }
}
