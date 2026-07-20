import type { DecisionRecord } from '@/types';

const decisionOverrides = new Map<string, DecisionRecord>();

export function getDecisionOverride(recommendationId: string): DecisionRecord | undefined {
  return decisionOverrides.get(recommendationId);
}

export function setDecisionOverride(record: DecisionRecord): DecisionRecord {
  decisionOverrides.set(record.recommendationId, record);
  return record;
}

export function listDecisionOverrides(): DecisionRecord[] {
  return [...decisionOverrides.values()];
}

export function resolveDecisionStatus(
  recommendationId: string,
  baseStatus: string,
): 'pending' | 'approved' | 'rejected' | 'waiting' {
  const override = decisionOverrides.get(recommendationId);
  if (override) return override.status;

  if (baseStatus === 'approved') return 'approved';
  if (baseStatus === 'rejected') return 'rejected';
  if (baseStatus === 'submitted') return 'waiting';
  return 'pending';
}
