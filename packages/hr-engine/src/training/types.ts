/** @module training/types */
import type { EmployeeId } from '../employee/types.js';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CertificationId, CourseId, EmployeeSkillId, TrainingCompletionId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { CertificationId, CourseId, EmployeeSkillId, TrainingCompletionId };

export type CourseStatus = 'active' | 'archived';

export interface Course extends TenantAuditableEntity<CourseId> {
  readonly title: string;
  readonly durationHours: number;
  readonly status: CourseStatus;
}

export interface Certification extends TenantAuditableEntity<CertificationId> {
  readonly name: string;
  readonly issuingBody?: string;
  /** Months of validity from the completion date; `undefined` means it never expires. */
  readonly validityMonths?: number;
}

export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface EmployeeSkill extends TenantAuditableEntity<EmployeeSkillId> {
  readonly employeeId: EmployeeId;
  readonly skillName: string;
  readonly proficiency: SkillProficiency;
}

export interface TrainingCompletion extends TenantAuditableEntity<TrainingCompletionId> {
  readonly employeeId: EmployeeId;
  readonly courseId: CourseId;
  readonly completedAt: ISODate;
  readonly score?: number;
  readonly certificationId?: CertificationId;
  readonly expiresAt?: ISODate;
}
