/** @module training/repository */
import type { EmployeeId } from '../employee/types.js';
import type { Repository } from '../shared/repository.js';
import type { CertificationId, CourseId, EmployeeSkillId, OrganizationId, TrainingCompletionId } from '../shared/identifiers.js';
import type { Certification, Course, EmployeeSkill, TrainingCompletion } from './types.js';

export interface CourseRepository extends Repository<Course, CourseId> {
  findAll(organizationId: OrganizationId): Promise<readonly Course[]>;
}

export interface CertificationRepository extends Repository<Certification, CertificationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Certification[]>;
}

export interface EmployeeSkillRepository extends Repository<EmployeeSkill, EmployeeSkillId> {
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly EmployeeSkill[]>;
  findByEmployeeAndSkill(organizationId: OrganizationId, employeeId: EmployeeId, skillName: string): Promise<EmployeeSkill | null>;
}

export interface TrainingCompletionRepository extends Repository<TrainingCompletion, TrainingCompletionId> {
  findAll(organizationId: OrganizationId): Promise<readonly TrainingCompletion[]>;
  findByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly TrainingCompletion[]>;
  findByCourse(organizationId: OrganizationId, courseId: CourseId): Promise<readonly TrainingCompletion[]>;
}
