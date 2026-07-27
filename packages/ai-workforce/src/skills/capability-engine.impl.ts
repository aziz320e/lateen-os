/**
 * Real Capability Engine — evaluates a worker's skills, capabilities,
 * certifications, and tool access against a {@link CapabilityRequirement}.
 * Pure, deterministic, offline: no AI/LLM involvement.
 *
 * @module skills/capability-engine.impl
 */
import { guardFail, guardPass, type Result, type DomainError } from '@lateen-os/shared-kernel/core';
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { AIWorker } from '../worker/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { SkillDefinitionRepository } from './repository.js';
import type { CapabilityRequirement, SkillDefinition, SkillId, ToolAccessScope } from './types.js';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

const SKILL_LEVEL_RANK: Readonly<Record<SkillLevel, number>> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

function toNumber(score: ScoreValue): number {
  const parsed = Number.parseFloat(score);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toleratesScope(granted: ToolAccessScope, required: ToolAccessScope): boolean {
  return granted === required || granted === 'admin';
}

export type CapabilityValidationResult = Result<void, DomainError>;

export interface CapabilityEngine {
  hasSkill(worker: AIWorker, skillId: SkillId, minLevel?: SkillLevel): boolean;
  hasCapability(worker: AIWorker, capabilityId: Identifier, minProficiency?: ScoreValue): boolean;
  hasCertification(worker: AIWorker, certificationId: Identifier, at?: string): boolean;
  hasToolAccess(worker: AIWorker, toolId: Identifier, scope: ToolAccessScope): boolean;
  /** Validates every facet of a {@link CapabilityRequirement} against a worker, returning the first failure. */
  validate(worker: AIWorker, requirement: CapabilityRequirement): CapabilityValidationResult;
  /** Deterministic 0.00–1.00 match score — the fraction of requirement facets the worker satisfies. */
  matchScore(worker: AIWorker, requirement: CapabilityRequirement): ScoreValue;
  listSkillCatalog(organizationId: OrganizationId): Promise<readonly SkillDefinition[]>;
}

/** Creates a real {@link CapabilityEngine} over the skill catalog repository. */
export function createCapabilityEngine(skillDefinitionRepository: SkillDefinitionRepository): CapabilityEngine {
  function hasSkill(worker: AIWorker, skillId: SkillId, minLevel?: SkillLevel): boolean {
    const skill = worker.skills.find((candidate) => candidate.skillId === skillId);
    if (!skill) return false;
    if (!minLevel) return true;
    return SKILL_LEVEL_RANK[skill.level] >= SKILL_LEVEL_RANK[minLevel];
  }

  function hasCapability(worker: AIWorker, capabilityId: Identifier, minProficiency?: ScoreValue): boolean {
    const capability = worker.capabilities.find((candidate) => candidate.capabilityId === capabilityId);
    if (!capability) return false;
    if (!minProficiency) return true;
    return toNumber(capability.proficiency) >= toNumber(minProficiency);
  }

  function hasCertification(worker: AIWorker, certificationId: Identifier, at: string = new Date().toISOString()): boolean {
    const certification = worker.certifications.find((candidate) => candidate.certificationId === certificationId);
    if (!certification) return false;
    if (!certification.expiresAt) return true;
    return certification.expiresAt > at;
  }

  function hasToolAccess(worker: AIWorker, toolId: Identifier, scope: ToolAccessScope): boolean {
    return worker.toolAccess.some((grant) => grant.toolId === toolId && toleratesScope(grant.scope, scope));
  }

  function validate(worker: AIWorker, requirement: CapabilityRequirement): CapabilityValidationResult {
    for (const skillId of requirement.requiredSkillIds ?? []) {
      if (!hasSkill(worker, skillId, requirement.minSkillLevel)) {
        return guardFail('workforce.capability.missing_skill', `Worker "${worker.id}" is missing required skill "${skillId}"`);
      }
    }
    for (const capabilityId of requirement.requiredCapabilityIds ?? []) {
      if (!hasCapability(worker, capabilityId)) {
        return guardFail(
          'workforce.capability.missing_capability',
          `Worker "${worker.id}" is missing required capability "${capabilityId}"`,
        );
      }
    }
    for (const certificationId of requirement.requiredCertificationIds ?? []) {
      if (!hasCertification(worker, certificationId)) {
        return guardFail(
          'workforce.capability.missing_certification',
          `Worker "${worker.id}" is missing a valid certification "${certificationId}"`,
        );
      }
    }
    for (const toolRequirement of requirement.requiredToolAccess ?? []) {
      if (!hasToolAccess(worker, toolRequirement.toolId, toolRequirement.scope)) {
        return guardFail(
          'workforce.capability.missing_tool_access',
          `Worker "${worker.id}" lacks "${toolRequirement.scope}" access to tool "${toolRequirement.toolId}"`,
        );
      }
    }
    return guardPass();
  }

  function matchScore(worker: AIWorker, requirement: CapabilityRequirement): ScoreValue {
    const facets: boolean[] = [];
    for (const skillId of requirement.requiredSkillIds ?? []) {
      facets.push(hasSkill(worker, skillId, requirement.minSkillLevel));
    }
    for (const capabilityId of requirement.requiredCapabilityIds ?? []) {
      facets.push(hasCapability(worker, capabilityId));
    }
    for (const certificationId of requirement.requiredCertificationIds ?? []) {
      facets.push(hasCertification(worker, certificationId));
    }
    for (const toolRequirement of requirement.requiredToolAccess ?? []) {
      facets.push(hasToolAccess(worker, toolRequirement.toolId, toolRequirement.scope));
    }
    if (facets.length === 0) return '1.00';
    const satisfied = facets.filter(Boolean).length;
    return (satisfied / facets.length).toFixed(2);
  }

  return {
    hasSkill,
    hasCapability,
    hasCertification,
    hasToolAccess,
    validate,
    matchScore,
    async listSkillCatalog(organizationId) {
      return skillDefinitionRepository.findAll(organizationId);
    },
  };
}
