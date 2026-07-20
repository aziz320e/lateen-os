import { NextResponse } from 'next/server';
import { buildConversationContext } from '@/lib/api/context-server';
import { listTraces } from '@/lib/audit';

export async function GET() {
  const [context, traces] = await Promise.all([buildConversationContext(), Promise.resolve(listTraces(20))]);
  return NextResponse.json({ context, traces });
}
