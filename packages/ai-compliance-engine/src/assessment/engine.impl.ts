/**
 * Real Assessment Engine — deterministic per-control classification
 * (passed/failed/pending) and per-framework compliance scoring
 * (compliant/partially_compliant/non_compliant/not_assessed). No AI
 * model — every decision is a fixed, explainable rule over a control's
 * status, implementation status, expiry, and evidence presence.
 *
 * @module assessment/engine.impl
 */
import type { ComplianceControl } from '../control/types.js';
import type { ComplianceControlRepository } from '../control/repository.js';
import type { EvidenceRepository } from '../evidence/repository.js';
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceControlId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceAssessmentRepository } from './repository.js';
import type { ComplianceAssessment, ComplianceStatus, ControlEvaluationOutcome } from './types.js';

/** Pure: classifies a single control as passed/failed/pending given whether evidence exists and the assessment clock. Retired controls are out of scope entirely (callers must filter them out beforehand). */
export function evaluateControlOutcome(control: ComplianceControl, hasEvidence: boolean, asOf: string): ControlEvaluationOutcome {
  if (control.status !== 'approved') return 'pending';
  const isExpired = control.expiresAt !== undefined && control.expiresAt < asOf;
  if (isExpired) return 'failed';
  if (control.implementationStatus === 'not_implemented') return 'failed';
  if (control.implementationStatus === 'implemented' && hasEvidence) return 'passed';
  return 'pending';
}

/** Pure: the overall compliance status given bucketed control counts. */
export function computeComplianceStatus(passedCount: number, failedCount: number, pendingCount: number): ComplianceStatus {
  const total = passedCount + failedCount + pendingCount;
  if (total === 0) return 'not_assessed';
  if (failedCount > 0) return 'non_compliant';
  if (pendingCount === 0) return 'compliant';
  return 'partially_compliant';
}

/** Pure: the compliance score as a percentage of passed controls out of every control in scope. */
export function computeComplianceScore(passedCount: number, failedCount: number, pendingCount: number): number {
  const total = passedCount + failedCount + pendingCount;
  if (total === 0) return 0;
  return Math.round((passedCount / total) * 10000) / 100;
}

export interface RunAssessmentInput {
  readonly asOf?: string;
}

export interface AssessmentEngine {
  runAssessment(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId, input?: RunAssessmentInput): Promise<ComplianceAssessment>;
  get(organizationId: OrganizationId, assessmentId: string): Promise<ComplianceAssessment | null>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceAssessment[]>;
  /** The most recent assessment for a framework, or `null` if none has run. */
  getLatest(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceAssessment | null>;
}

/** Creates a real {@link AssessmentEngine} backed by the control, evidence, and assessment repositories. */
export function createAssessmentEngine(
  controlRepository: ComplianceControlRepository,
  evidenceRepository: EvidenceRepository,
  repository: ComplianceAssessmentRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): AssessmentEngine {
  return {
    async runAssessment(organizationId, frameworkId, input) {
      const asOf = input?.asOf ?? now();
      const controls = (await controlRepository.findByFrameworkId(organizationId, frameworkId)).filter((control) => control.status !== 'retired');

      const passedControlIds: ComplianceControlId[] = [];
      const failedControlIds: ComplianceControlId[] = [];
      const pendingControlIds: ComplianceControlId[] = [];

      for (const control of controls) {
        const evidence = await evidenceRepository.findByControlId(organizationId, control.id);
        const outcome = evaluateControlOutcome(control, evidence.length > 0, asOf);
        if (outcome === 'passed') {
          passedControlIds.push(control.id);
          eventBus?.publish('control.passed', { organizationId, controlId: control.id });
        } else if (outcome === 'failed') {
          failedControlIds.push(control.id);
          const isExpired = control.expiresAt !== undefined && control.expiresAt < asOf;
          eventBus?.publish('control.failed', { organizationId, controlId: control.id, reason: isExpired ? 'expired' : 'not_implemented' });
        } else {
          pendingControlIds.push(control.id);
        }
      }

      const status = computeComplianceStatus(passedControlIds.length, failedControlIds.length, pendingControlIds.length);
      const score = computeComplianceScore(passedControlIds.length, failedControlIds.length, pendingControlIds.length);

      const timestamp = now();
      const assessment: ComplianceAssessment = {
        id: generateId('compliance-assessment'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkId,
        status,
        score,
        passedControlIds,
        failedControlIds,
        pendingControlIds,
        assessedAt: timestamp,
      };
      await repository.save(assessment);
      eventBus?.publish('assessment.completed', { organizationId, assessmentId: assessment.id, frameworkId, status, score });
      return assessment;
    },

    async get(organizationId, assessmentId) {
      return repository.findById(organizationId, assessmentId);
    },

    async findByFrameworkId(organizationId, frameworkId) {
      return repository.findByFrameworkId(organizationId, frameworkId);
    },

    async getLatest(organizationId, frameworkId) {
      const assessments = await repository.findByFrameworkId(organizationId, frameworkId);
      if (assessments.length === 0) return null;
      // Reverse before a stable sort so that, when two assessments tie on
      // `assessedAt` (millisecond clock resolution), the more recently
      // inserted one wins rather than the array's original (oldest-first) order.
      return [...assessments].reverse().sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : a.assessedAt > b.assessedAt ? -1 : 0))[0]!;
    },
  };
}
