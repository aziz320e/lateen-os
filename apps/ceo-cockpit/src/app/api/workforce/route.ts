import { NextResponse } from 'next/server';
import { listAgents } from '@/lib/api/business-dna-server';
import { mapAgentsToWorkers } from '@/lib/api/view-mappers';

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ workers: mapAgentsToWorkers(agents) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Workforce failed' }, { status: 502 });
  }
}
