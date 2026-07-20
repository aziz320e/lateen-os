import { NextResponse } from 'next/server';
import { searchAll } from '@/lib/api/orchestrator';
import { searchCommands } from '@/lib/api/command-router';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type');

  if (type === 'commands') {
    return NextResponse.json({ results: searchCommands(q) });
  }

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchAll(q);
  return NextResponse.json({ results });
}
