/** @module risk/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { ProjectRiskId } from '../shared/identifiers.js';

export type { ProjectRiskId };

export type RiskStatus = 'identified' | 'mitigating' | 'resolved' | 'accepted' | 'occurred';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * A single risk-register entry. `probability` and `impact` are each a
 * 1–5 ordinal rating; `score` is their deterministic product
 * (max 25) — never a model-based prediction.
 */
export interface ProjectRisk extends TenantAuditableEntity<ProjectRiskId> {
  readonly projectId: ProjectId;
  readonly title: string;
  readonly description?: string;
  readonly probability: number;
  readonly impact: number;
  readonly score: number;
  readonly mitigation?: string;
  readonly status: RiskStatus;
}
