import { NextResponse } from 'next/server';
import { buildExecutiveDashboard } from '@/lib/api/dashboard-server';

export async function GET() {
  try {
    const dashboard = await buildExecutiveDashboard();
    return NextResponse.json({ entries: dashboard.memory });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Memory failed' }, { status: 502 });
  }
}
