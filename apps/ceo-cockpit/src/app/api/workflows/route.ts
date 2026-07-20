import { NextResponse } from 'next/server';
import { listWorkflows } from '@/lib/api/business-dna-server';
import { mapWorkflowsFromBds } from '@/lib/api/view-mappers';

export async function GET() {
  try {
    const workflows = await listWorkflows();
    return NextResponse.json({ workflows: mapWorkflowsFromBds(workflows) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Workflows failed' }, { status: 502 });
  }
}
