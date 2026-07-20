import { NextResponse } from 'next/server';
import {
  appendMessage,
  createConversation,
  getConversation,
  listConversations,
  pinConversation,
} from '@/lib/conversation-store';
import { orchestrateMessage } from '@/lib/api/orchestrator';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') ?? undefined;
  const conversationId = searchParams.get('conversationId');

  if (conversationId) {
    const conv = getConversation(conversationId);
    if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(conv);
  }

  return NextResponse.json({ conversations: listConversations(query) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message: string;
    conversationId?: string;
    stream?: boolean;
    pin?: boolean;
  };

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  let conversation = body.conversationId ? getConversation(body.conversationId) : undefined;
  if (!conversation) {
    conversation = createConversation(body.message);
  }

  appendMessage(conversation.id, { role: 'user', content: body.message });

  const result = await orchestrateMessage(body.message, conversation.id);

  const assistantMessage = appendMessage(conversation.id, {
    role: 'assistant',
    content: result.markdown,
    metadata: {
      command: result.command,
      service: result.service,
      traceId: result.traceId,
      chart: result.chart,
      table: result.table,
      code: result.code,
    },
  });

  if (body.pin) pinConversation(conversation.id, true);

  if (body.stream) {
    const encoder = new TextEncoder();
    const words = result.markdown.split(/(\s+)/);
    const stream = new ReadableStream({
      async start(controller) {
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: word })}\n\n`));
          await new Promise((r) => setTimeout(r, 8));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, message: assistantMessage, conversationId: conversation!.id })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    message: assistantMessage,
    traceId: result.traceId,
    correlation: result.correlation,
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { conversationId: string; pinned: boolean };
  const conv = pinConversation(body.conversationId, body.pinned);
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(conv);
}
