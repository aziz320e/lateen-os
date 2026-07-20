import type { MissionSource, TriggerType } from '../domain/types';

/** Maps inbound platform events to scheduler trigger types — contract only. */
export function mapInboundEventToTrigger(eventName: string): { type: TriggerType; source: MissionSource } | null {
  const map: Record<string, { type: TriggerType; source: MissionSource }> = {
    'decision.approved': { type: 'DECISION_APPROVED', source: 'DECISION_EVENT' },
    'workflow.completed': { type: 'WORKFLOW_COMPLETED', source: 'WORKFLOW_EVENT' },
    'connector.sync.completed': { type: 'CONNECTOR_SYNC', source: 'CONNECTOR_WEBHOOK' },
    'discovery.signal': { type: 'THRESHOLD_EXCEEDED', source: 'INTELLIGENCE_SIGNAL' },
    'system.health.degraded': { type: 'THRESHOLD_EXCEEDED', source: 'SYSTEM_HEALTH' },
    'memory.entry.created': { type: 'BUSINESS_EVENT', source: 'INSTITUTIONAL_MEMORY' },
    'business.event': { type: 'BUSINESS_EVENT', source: 'BUSINESS_EVENT' },
  };
  return map[eventName] ?? null;
}

export class EventListenerService {
  async ingestEvent(input: { eventName: string; organizationId: string; payload: Record<string, unknown> }) {
    const mapping = mapInboundEventToTrigger(input.eventName);
    if (!mapping) return { accepted: false, reason: 'Unknown event' };
    return {
      accepted: true,
      triggerType: mapping.type,
      source: mapping.source,
      organizationId: input.organizationId,
      payload: input.payload,
    };
  }
}
