/**
 * Real Audit Engine — audit plans, execution, findings (observations,
 * recommendations, and corrective actions linking to this package's
 * own Remediation Engine).
 *
 * @module audit-engine/engine.impl
 */
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import { ComplianceAuditNotFoundError, InvalidAuditTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceAuditId, ComplianceFrameworkId, OrganizationId, RemediationId } from '../shared/identifiers.js';
import type { ComplianceAuditRepository } from './repository.js';
import type { AuditFinding, AuditFindingSeverity, ComplianceAudit, ComplianceAuditStatus } from './types.js';

const AUDIT_TRANSITIONS: Readonly<Record<ComplianceAuditStatus, readonly ComplianceAuditStatus[]>> = {
  planned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/** Whether a compliance audit may transition from one status to another. */
export function canTransitionAudit(from: ComplianceAuditStatus, to: ComplianceAuditStatus): boolean {
  return AUDIT_TRANSITIONS[from].includes(to);
}

export interface CreateAuditPlanInput {
  readonly title: string;
  readonly frameworkId?: ComplianceFrameworkId;
  readonly scope?: string;
  readonly plannedStartDate?: string;
}

export interface RecordFindingInput {
  readonly severity: AuditFindingSeverity;
  readonly description: string;
  readonly recommendation?: string;
  readonly correctiveActionId?: RemediationId;
}

export interface AuditEngine {
  createAuditPlan(organizationId: OrganizationId, input: CreateAuditPlanInput): Promise<ComplianceAudit>;
  startAudit(organizationId: OrganizationId, auditId: ComplianceAuditId): Promise<ComplianceAudit>;
  recordFinding(organizationId: OrganizationId, auditId: ComplianceAuditId, input: RecordFindingInput): Promise<ComplianceAudit>;
  completeAudit(organizationId: OrganizationId, auditId: ComplianceAuditId): Promise<ComplianceAudit>;
  cancelAudit(organizationId: OrganizationId, auditId: ComplianceAuditId): Promise<ComplianceAudit>;
  get(organizationId: OrganizationId, auditId: ComplianceAuditId): Promise<ComplianceAudit | null>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceAudit[]>;
}

/** Creates a real {@link AuditEngine} backed by a {@link ComplianceAuditRepository}. */
export function createAuditEngine(
  repository: ComplianceAuditRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): AuditEngine {
  async function requireAudit(organizationId: OrganizationId, auditId: ComplianceAuditId): Promise<ComplianceAudit> {
    const audit = await repository.findById(organizationId, auditId);
    if (!audit) throw new ComplianceAuditNotFoundError(auditId);
    return audit;
  }

  async function transition(organizationId: OrganizationId, auditId: ComplianceAuditId, to: ComplianceAuditStatus): Promise<ComplianceAudit> {
    const audit = await requireAudit(organizationId, auditId);
    if (!canTransitionAudit(audit.status, to)) {
      throw new InvalidAuditTransitionError(auditId, audit.status, to);
    }
    const timestamp = now();
    const updated: ComplianceAudit = {
      ...audit,
      status: to,
      startedAt: to === 'in_progress' ? timestamp : audit.startedAt,
      completedAt: to === 'completed' ? timestamp : audit.completedAt,
      updatedAt: timestamp,
    };
    await repository.save(updated);
    return updated;
  }

  return {
    async createAuditPlan(organizationId, input) {
      const timestamp = now();
      const audit: ComplianceAudit = {
        id: generateId('compliance-audit'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkId: input.frameworkId,
        title: input.title,
        scope: input.scope,
        status: 'planned',
        plannedStartDate: input.plannedStartDate,
        findings: [],
      };
      await repository.save(audit);
      return audit;
    },

    async startAudit(organizationId, auditId) {
      const updated = await transition(organizationId, auditId, 'in_progress');
      eventBus?.publish('audit.started', { organizationId, auditId });
      return updated;
    },

    async recordFinding(organizationId, auditId, input) {
      const audit = await requireAudit(organizationId, auditId);
      if (audit.status !== 'in_progress') {
        throw new InvalidAuditTransitionError(auditId, audit.status, audit.status);
      }
      const finding: AuditFinding = {
        id: generateId('audit-finding'),
        severity: input.severity,
        description: input.description,
        recommendation: input.recommendation,
        correctiveActionId: input.correctiveActionId,
        recordedAt: now(),
      };
      const updated: ComplianceAudit = { ...audit, findings: [...audit.findings, finding], updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async completeAudit(organizationId, auditId) {
      const updated = await transition(organizationId, auditId, 'completed');
      eventBus?.publish('audit.completed', { organizationId, auditId, findingCount: updated.findings.length });
      return updated;
    },

    async cancelAudit(organizationId, auditId) {
      return transition(organizationId, auditId, 'cancelled');
    },

    async get(organizationId, auditId) {
      return repository.findById(organizationId, auditId);
    },

    async findByFrameworkId(organizationId, frameworkId) {
      return repository.findByFrameworkId(organizationId, frameworkId);
    },
  };
}
