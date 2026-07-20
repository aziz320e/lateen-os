import { NextResponse } from 'next/server';
import { getAutomation } from '@/lib/mock-data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const automation = getAutomation(id);
  if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(automation);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const automation = getAutomation(id);
  if (!automation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await request.json();
  return NextResponse.json({ ...automation, ...body, version: automation.version + 1, updatedAt: new Date().toISOString() });
}
