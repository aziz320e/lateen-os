/** @module skills/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, SkillId } from '../shared/identifiers.js';
import type { ScoreValue, WorkforceType } from '../shared/primitives.js';

export type { SkillId };

export type SkillCategory =
  | 'domain'
  | 'technical'
  | 'analytical'
  | 'communication'
  | 'governance'
  | 'leadership';

/** Canonical skill definition in the workforce catalog. */
export interface SkillDefinition extends TenantAuditableEntity<SkillId> {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly category: SkillCategory;
  readonly applicableWorkforceTypes: readonly WorkforceType[];
  readonly requiredProficiency: ScoreValue;
}

/** Proficiency level for a skill assignment. */
export interface SkillProficiency {
  readonly skillId: SkillId;
  readonly level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly score: ScoreValue;
  readonly assessedAt: string;
  readonly assessedBy?: string;
}

export type { OrganizationId };
