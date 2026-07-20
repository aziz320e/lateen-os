import { NextResponse } from 'next/server';
import { searchFetch } from '@/lib/api/search-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await searchFetch('/api/search', { method: 'POST', body: JSON.stringify(body) });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Search unavailable' }, { status: 502 });
  }
}
