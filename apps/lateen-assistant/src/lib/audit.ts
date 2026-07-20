import { randomUUID } from 'node:crypto';

export interface AuditTrace {
  readonly traceId: string;
  readonly conversationId?: string;
  readonly missionId?: string;
  readonly decisionId?: string;
  readonly workflowId?: string;
  readonly service: string;
  readonly action: string;
  readonly occurredAt: string;
}

const traces: AuditTrace[] = [];

export function recordTrace(input: Omit<AuditTrace, 'traceId' | 'occurredAt'>): AuditTrace {
  const trace: AuditTrace = {
    traceId: randomUUID(),
    occurredAt: new Date().toISOString(),
    ...input,
  };
  traces.unshift(trace);
  if (traces.length > 500) traces.pop();
  return trace;
}

export function listTraces(limit = 50): AuditTrace[] {
  return traces.slice(0, limit);
}

export function listTracesForConversation(conversationId: string): AuditTrace[] {
  return traces.filter((t) => t.conversationId === conversationId);
}
