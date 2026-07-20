import { NextResponse } from 'next/server';
import { cloudFetch } from '@/lib/api/cloud-server';

export async function GET() {
  try {
    return NextResponse.json(await cloudFetch('/api/billing'));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unavailable' }, { status: 502 });
  }
}
