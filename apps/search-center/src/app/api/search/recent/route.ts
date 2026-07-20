import { NextResponse } from 'next/server';
import { searchFetch } from '@/lib/api/search-server';

export async function GET() {
  try {
    const data = await searchFetch('/api/search/recent?organizationId=org-1&userId=demo-user');
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
