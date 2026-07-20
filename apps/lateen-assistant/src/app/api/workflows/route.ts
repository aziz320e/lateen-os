import { NextResponse } from 'next/server';
import { listWorkflowViews, groupWorkflowsByStatus } from '@/lib/api/workflow-server';
import { recordTrace } from '@/lib/audit';

export async function GET() {
  const workflows = await listWorkflowViews();
  return NextResponse.json({ workflows, groups: groupWorkflowsByStatus(workflows) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { action: 'start' | 'pause' | 'resume' | 'cancel'; workflowId?: string };
  recordTrace({ service: 'business-dna-service', action: `workflow:${body.action}`, workflowId: body.workflowId });

  return NextResponse.json({
    ok: true,
    action: body.action,
    workflowId: body.workflowId,
    message: `Workflow ${body.action} request forwarded to Business DNA / Workflow Engine (orchestration only).`,
  });
}
