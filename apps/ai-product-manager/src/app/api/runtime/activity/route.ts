import { NextResponse } from 'next/server';
import { buildActivityTimeline } from '@/lib/api/runtime-server';

export async function GET() {
  try {
    return NextResponse.json(await buildActivityTimeline());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load activity' },
      { status: 502 },
    );
  }
}
