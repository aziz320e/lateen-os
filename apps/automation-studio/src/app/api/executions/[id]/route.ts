import { NextResponse } from 'next/server';
import { getExecution } from '@/lib/mock-data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const execution = getExecution(id);
  if (!execution) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(execution);
}
