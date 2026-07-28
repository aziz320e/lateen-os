/** Real, in-memory Training Engine repositories. @module training/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CertificationRepository, CourseRepository, EmployeeSkillRepository, TrainingCompletionRepository } from './repository.js';
import type { Certification, Course, EmployeeSkill, TrainingCompletion } from './types.js';

/** Creates a real, in-memory {@link CourseRepository}. */
export function createCourseRepository(seed?: readonly Course[]): CourseRepository {
  const repo = createInMemoryRepository<Course>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link CertificationRepository}. */
export function createCertificationRepository(seed?: readonly Certification[]): CertificationRepository {
  const repo = createInMemoryRepository<Certification>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link EmployeeSkillRepository}. */
export function createEmployeeSkillRepository(seed?: readonly EmployeeSkill[]): EmployeeSkillRepository {
  const repo = createInMemoryRepository<EmployeeSkill>({ seed });
  return {
    ...repo,
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((skill) => skill.employeeId === employeeId);
    },
    async findByEmployeeAndSkill(organizationId, employeeId, skillName) {
      return repo.list(organizationId).find((skill) => skill.employeeId === employeeId && skill.skillName === skillName) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link TrainingCompletionRepository}. */
export function createTrainingCompletionRepository(seed?: readonly TrainingCompletion[]): TrainingCompletionRepository {
  const repo = createInMemoryRepository<TrainingCompletion>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByEmployee(organizationId, employeeId) {
      return repo.list(organizationId).filter((completion) => completion.employeeId === employeeId);
    },
    async findByCourse(organizationId, courseId) {
      return repo.list(organizationId).filter((completion) => completion.courseId === courseId);
    },
  };
}
