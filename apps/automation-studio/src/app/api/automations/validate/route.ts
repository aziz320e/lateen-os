import { NextResponse } from 'next/server';
import { getAutomation } from '@/lib/mock-data';

export async function POST(request: Request) {
  const { automationId } = await request.json();
  const automation = getAutomation(automationId);
  if (!automation) return NextResponse.json({ valid: false, errors: ['Automation not found'] }, { status: 404 });

  const errors: string[] = [];
  const hasTrigger = automation.nodes.some((n) => n.type === 'trigger');
  if (!hasTrigger) errors.push('Missing trigger node');
  if (automation.nodes.length === 0) errors.push('Workflow is empty');

  return NextResponse.json({
    valid: errors.length === 0,
    errors,
    nodeCount: automation.nodes.length,
    edgeCount: automation.edges.length,
    note: 'Design-time validation only — execution via Workflow Engine',
  });
}
