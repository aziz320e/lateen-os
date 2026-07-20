import { NextResponse } from 'next/server';
import { buildRuntimeTasks } from '@/lib/api/runtime-server';

export async function GET() {
  try {
    const tasks = await buildRuntimeTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load runtime' },
      { status: 502 },
    );
  }
}
