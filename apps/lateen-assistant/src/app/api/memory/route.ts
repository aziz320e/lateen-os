import { NextResponse } from 'next/server';
import { buildMemoryEntries } from '@/lib/api/orchestrator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  let entries = await buildMemoryEntries();

  if (category) {
    entries = entries.filter((e) => e.category === category);
  }

  return NextResponse.json({ entries });
}
