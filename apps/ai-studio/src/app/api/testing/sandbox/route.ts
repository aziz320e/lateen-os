import { NextResponse } from 'next/server';
import { getWorker } from '@/lib/mock-data';

export async function POST(request: Request) {
  const { workerId, message } = await request.json();
  const worker = getWorker(workerId);
  if (!worker) return NextResponse.json({ error: 'Worker not found' }, { status: 404 });

  return NextResponse.json({
    conversation: [
      { role: 'user', content: message },
      { role: 'assistant', content: `[Sandbox stub] ${worker.name} would respond via AI Runtime — not executed in Studio.` },
    ],
    reasoningTrace: [
      'Intent: sandbox test',
      `Worker: ${worker.name}`,
      'Policy: design-only — no AI Runtime invocation',
      'Decision Engine: not invoked',
    ],
    tokenUsage: { prompt: 120, completion: 45 },
    latencyMs: 0,
    costUsd: '0.00',
    outputValid: true,
    note: 'Sandbox is design-time only. Execution remains in AI Runtime.',
  });
}
