import { NextResponse } from 'next/server';
import { buildExecutiveDashboard } from '@/lib/api/dashboard-server';

export async function GET() {
  try {
    const dashboard = await buildExecutiveDashboard();
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dashboard failed' }, { status: 502 });
  }
}
