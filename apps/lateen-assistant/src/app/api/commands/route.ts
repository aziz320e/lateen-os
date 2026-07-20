import { NextResponse } from 'next/server';
import { COMMAND_CATALOG, searchCommands } from '@/lib/api/command-router';
import { orchestrateMessage } from '@/lib/api/orchestrator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  return NextResponse.json({ commands: q ? searchCommands(q) : COMMAND_CATALOG });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { command: string; conversationId?: string };
  if (!body.command?.trim()) {
    return NextResponse.json({ error: 'Command required' }, { status: 400 });
  }
  const result = await orchestrateMessage(body.command.startsWith('/') ? body.command : `/${body.command}`, body.conversationId);
  return NextResponse.json(result);
}
