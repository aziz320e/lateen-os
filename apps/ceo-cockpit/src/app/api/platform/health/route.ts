import { NextResponse } from 'next/server';
import { collectPlatformHealth } from '@/lib/api/platform-health';

export async function GET() {
  try {
    const health = await collectPlatformHealth();
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Health check failed' }, { status: 502 });
  }
}
