import { NextResponse } from 'next/server';
import {
  listOrdersForCustomer,
  listProjectsForCustomer,
  listQuotationsForCustomer,
} from '@/lib/api/business-dna-server';
import { buildAssistantReply } from '@/lib/api/portal-mappers';
import { PortalAuthError } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message: string };
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const [projects, quotations, orders] = await Promise.all([
      listProjectsForCustomer(),
      listQuotationsForCustomer(),
      listOrdersForCustomer(),
    ]);

    const reply = buildAssistantReply(message, projects, quotations, orders);
    return NextResponse.json({
      reply,
      disclaimer: 'Answers are based on your account data only. Internal organizational data is never exposed.',
    });
  } catch (error) {
    const status = error instanceof PortalAuthError ? error.status : 502;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Assistant failed' }, { status });
  }
}
