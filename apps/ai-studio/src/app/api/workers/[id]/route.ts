import { NextResponse } from 'next/server';
import { getWorker } from '@/lib/mock-data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = getWorker(id);
  if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(worker);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = getWorker(id);
  if (!worker) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json();
  return NextResponse.json({ ...worker, ...body, version: worker.version + 1, updatedAt: new Date().toISOString() });
}
