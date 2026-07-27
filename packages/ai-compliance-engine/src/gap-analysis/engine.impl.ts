/**
 * Real Gap Analysis engine — deterministic detection of missing
 * controls, expired controls, missing evidence, and orphaned policies,
 * plus a deterministic remediation plan. "Orphaned policies" is the
 * one real, optional AI Governance Engine integration point in this
 * package: it cross-references every real, active governance policy
 * against this package's own Control Mapping records.
 *
 * @module gap-analysis/engine.impl
 */
import type { GovernanceQueries } from '@lateen-os/ai-governance-engine';
import type { ComplianceControlRepository } from '../control/repository.js';
import type { ControlMappingRepository } from '../control-mapping/repository.js';
import type { EvidenceRepository } from '../evidence/repository.js';
import type { ComplianceFrameworkRepository } from '../framework/repository.js';
import { ComplianceFrameworkNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { GapAnalysisRepository } from './repository.js';
import type { GapAnalysisResult, RemediationPlanItem } from './types.js';

export interface GapAnalysisDeps {
  readonly aiGovernance?: Pick<GovernanceQueries, 'findPolicies'>;
}

export interface AnalyzeGapsInput {
  readonly asOf?: string;
}

export interface GapAnalysisEngine {
  analyze(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId, input?: AnalyzeGapsInput): Promise<GapAnalysisResult>;
  get(organizationId: OrganizationId, gapAnalysisId: string): Promise<GapAnalysisResult | null>;
  findByFrameworkId(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly GapAnalysisResult[]>;
}

/** Creates a real {@link GapAnalysisEngine} over the framework, control, control-mapping, evidence, and gap-analysis repositories. */
export function createGapAnalysisEngine(
  frameworkRepository: ComplianceFrameworkRepository,
  controlRepository: ComplianceControlRepository,
  controlMappingRepository: ControlMappingRepository,
  evidenceRepository: EvidenceRepository,
  repository: GapAnalysisRepository,
  deps: GapAnalysisDeps = {},
  now: () => string = nowIso,
): GapAnalysisEngine {
  return {
    async analyze(organizationId, frameworkId, input) {
      const asOf = input?.asOf ?? now();
      const framework = await frameworkRepository.findById(organizationId, frameworkId);
      if (!framework) throw new ComplianceFrameworkNotFoundError(frameworkId);

      const controls = (await controlRepository.findByFrameworkId(organizationId, frameworkId)).filter((control) => control.status !== 'retired');

      const missingControlTypes = framework.requiredControlTypes.filter(
        (type) => !controls.some((control) => control.controlType === type && control.status === 'approved' && control.implementationStatus === 'implemented'),
      );

      const expiredControlIds = controls.filter((control) => control.expiresAt !== undefined && control.expiresAt < asOf).map((control) => control.id);

      const controlsMissingEvidenceIds: string[] = [];
      for (const control of controls) {
        if (control.status !== 'approved' || control.implementationStatus !== 'implemented') continue;
        const evidence = await evidenceRepository.findByControlId(organizationId, control.id);
        if (evidence.length === 0) controlsMissingEvidenceIds.push(control.id);
      }

      const orphanedPolicyIds: string[] = [];
      if (deps.aiGovernance) {
        const { policies } = await deps.aiGovernance.findPolicies({ organizationId, status: 'active' });
        for (const policy of policies) {
          const mappings = await controlMappingRepository.findByMappedRecord(organizationId, 'policy', policy.id);
          if (mappings.length === 0) orphanedPolicyIds.push(policy.id);
        }
      }

      const remediationPlan: RemediationPlanItem[] = [
        ...missingControlTypes.map((type): RemediationPlanItem => ({
          gapType: 'missing_control',
          referenceId: type,
          suggestedAction: `Implement and approve at least one "${type}" control for this framework.`,
          priority: 'high',
        })),
        ...expiredControlIds.map((controlId): RemediationPlanItem => ({
          gapType: 'expired_control',
          referenceId: controlId,
          suggestedAction: `Renew or re-approve expired control "${controlId}".`,
          priority: 'critical',
        })),
        ...controlsMissingEvidenceIds.map((controlId): RemediationPlanItem => ({
          gapType: 'missing_evidence',
          referenceId: controlId,
          suggestedAction: `Collect evidence for implemented control "${controlId}".`,
          priority: 'medium',
        })),
        ...orphanedPolicyIds.map((policyId): RemediationPlanItem => ({
          gapType: 'orphaned_policy',
          referenceId: policyId,
          suggestedAction: `Map governance policy "${policyId}" to a compliance control.`,
          priority: 'low',
        })),
      ];

      const timestamp = now();
      const result: GapAnalysisResult = {
        id: generateId('gap-analysis'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkId,
        missingControlTypes,
        expiredControlIds,
        controlsMissingEvidenceIds,
        orphanedPolicyIds,
        remediationPlan,
        analyzedAt: timestamp,
      };
      await repository.save(result);
      return result;
    },

    async get(organizationId, gapAnalysisId) {
      return repository.findById(organizationId, gapAnalysisId);
    },

    async findByFrameworkId(organizationId, frameworkId) {
      return repository.findByFrameworkId(organizationId, frameworkId);
    },
  };
}
