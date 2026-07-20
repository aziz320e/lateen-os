import { NextResponse } from 'next/server';
import { buildExecutiveDashboard } from '@/lib/api/dashboard-server';

export async function GET() {
  try {
    const dashboard = await buildExecutiveDashboard();
    return NextResponse.json({ notifications: dashboard.notifications });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Notifications failed' }, { status: 502 });
  }
}
