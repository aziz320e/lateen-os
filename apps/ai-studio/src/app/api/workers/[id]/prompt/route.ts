import { NextResponse } from 'next/server';
import { getPrompt } from '@/lib/mock-data';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prompt = getPrompt(id);
  if (!prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(prompt);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  return NextResponse.json({ workerId: id, ...body, version: (body.version ?? 0) + 1 });
}
