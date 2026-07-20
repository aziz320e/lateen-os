import { NextResponse } from 'next/server';
import { listMachines } from '@/lib/api/business-dna-server';

export async function GET() {
  try {
    return NextResponse.json(await listMachines());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list machines' },
      { status: 502 },
    );
  }
}
