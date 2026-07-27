/** @module skills/types */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
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

/** Time-bounded certification granted to a worker (e.g. a compliance or domain credential). */
export interface WorkerCertification {
  readonly certificationId: Identifier;
  readonly name: string;
  readonly issuedAt: string;
  readonly expiresAt?: string;
  readonly issuer?: string;
}

/** Access level a tool grant confers. */
export type ToolAccessScope = 'read' | 'write' | 'execute' | 'admin';

/** Grant of access to a specific platform tool. */
export interface ToolAccessGrant {
  readonly toolId: Identifier;
  readonly toolName: string;
  readonly scope: ToolAccessScope;
  readonly grantedAt: string;
}

/** Composite capability requirement evaluated by the Capability Engine before an assignment. */
export interface CapabilityRequirement {
  readonly requiredSkillIds?: readonly SkillId[];
  readonly minSkillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly requiredCapabilityIds?: readonly Identifier[];
  readonly requiredCertificationIds?: readonly Identifier[];
  readonly requiredToolAccess?: readonly { readonly toolId: Identifier; readonly scope: ToolAccessScope }[];
}

export type { OrganizationId };
