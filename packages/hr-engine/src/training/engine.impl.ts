/**
 * Real Training Engine — courses, certifications, employee skills,
 * and deterministic completion tracking (a certification's
 * `expiresAt` is fixed arithmetic over its `validityMonths`, never a
 * guess).
 *
 * @module training/engine.impl
 */
import type { EmployeeId } from '../employee/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import { addMonthsIso } from '../shared/date.js';
import { CertificationNotFoundError, CourseNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CertificationId, CourseId, OrganizationId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type {
  CertificationRepository,
  CourseRepository,
  EmployeeSkillRepository,
  TrainingCompletionRepository,
} from './repository.js';
import type { Certification, Course, EmployeeSkill, SkillProficiency, TrainingCompletion } from './types.js';

/** Pure: a certification's expiry date, `validityMonths` after `completedAt` — `undefined` if it never expires. */
export function computeCertificationExpiry(completedAt: ISODate, validityMonths: number | undefined): ISODate | undefined {
  return validityMonths === undefined ? undefined : addMonthsIso(completedAt, validityMonths);
}

export interface CreateCourseInput {
  readonly title: string;
  readonly durationHours: number;
}

export interface CreateCertificationInput {
  readonly name: string;
  readonly issuingBody?: string;
  readonly validityMonths?: number;
}

export interface RecordSkillInput {
  readonly employeeId: EmployeeId;
  readonly skillName: string;
  readonly proficiency: SkillProficiency;
}

export interface RecordCompletionInput {
  readonly employeeId: EmployeeId;
  readonly courseId: CourseId;
  readonly completedAt: ISODate;
  readonly score?: number;
  readonly certificationId?: CertificationId;
}

export interface TrainingEngine {
  createCourse(organizationId: OrganizationId, input: CreateCourseInput): Promise<Course>;
  archiveCourse(organizationId: OrganizationId, courseId: CourseId): Promise<Course>;
  getCourse(organizationId: OrganizationId, courseId: CourseId): Promise<Course | null>;
  listCourses(organizationId: OrganizationId): Promise<readonly Course[]>;

  createCertification(organizationId: OrganizationId, input: CreateCertificationInput): Promise<Certification>;
  getCertification(organizationId: OrganizationId, certificationId: CertificationId): Promise<Certification | null>;
  listCertifications(organizationId: OrganizationId): Promise<readonly Certification[]>;

  /** Upserts one employee's proficiency for a named skill. */
  recordSkill(organizationId: OrganizationId, input: RecordSkillInput): Promise<EmployeeSkill>;
  findSkillsByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly EmployeeSkill[]>;

  /** Records a course completion, computing `expiresAt` when a certification with `validityMonths` is attached. Publishes `training.completed`. */
  recordCompletion(organizationId: OrganizationId, input: RecordCompletionInput): Promise<TrainingCompletion>;
  listCompletions(organizationId: OrganizationId): Promise<readonly TrainingCompletion[]>;
  findCompletionsByEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly TrainingCompletion[]>;
  findCompletionsByCourse(organizationId: OrganizationId, courseId: CourseId): Promise<readonly TrainingCompletion[]>;
}

/** Creates a real {@link TrainingEngine}. */
export function createTrainingEngine(
  courseRepository: CourseRepository,
  certificationRepository: CertificationRepository,
  skillRepository: EmployeeSkillRepository,
  completionRepository: TrainingCompletionRepository,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): TrainingEngine {
  async function requireCourse(organizationId: OrganizationId, courseId: CourseId): Promise<Course> {
    const course = await courseRepository.findById(organizationId, courseId);
    if (!course) throw new CourseNotFoundError(courseId);
    return course;
  }

  return {
    async createCourse(organizationId, input) {
      const timestamp = now();
      const course: Course = {
        id: generateId('course'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        durationHours: input.durationHours,
        status: 'active',
      };
      await courseRepository.save(course);
      return course;
    },

    async archiveCourse(organizationId, courseId) {
      const course = await requireCourse(organizationId, courseId);
      const updated: Course = { ...course, status: 'archived', updatedAt: now() };
      await courseRepository.save(updated);
      return updated;
    },

    async getCourse(organizationId, courseId) {
      return courseRepository.findById(organizationId, courseId);
    },

    async listCourses(organizationId) {
      return courseRepository.findAll(organizationId);
    },

    async createCertification(organizationId, input) {
      const timestamp = now();
      const certification: Certification = {
        id: generateId('certification'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        issuingBody: input.issuingBody,
        validityMonths: input.validityMonths,
      };
      await certificationRepository.save(certification);
      return certification;
    },

    async getCertification(organizationId, certificationId) {
      return certificationRepository.findById(organizationId, certificationId);
    },

    async listCertifications(organizationId) {
      return certificationRepository.findAll(organizationId);
    },

    async recordSkill(organizationId, input) {
      const existing = await skillRepository.findByEmployeeAndSkill(organizationId, input.employeeId, input.skillName);
      const timestamp = now();
      const skill: EmployeeSkill = {
        id: existing?.id ?? generateId('employee-skill'),
        organizationId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        skillName: input.skillName,
        proficiency: input.proficiency,
      };
      await skillRepository.save(skill);
      return skill;
    },

    async findSkillsByEmployee(organizationId, employeeId) {
      return skillRepository.findByEmployee(organizationId, employeeId);
    },

    async recordCompletion(organizationId, input) {
      await requireCourse(organizationId, input.courseId);
      let expiresAt: ISODate | undefined;
      if (input.certificationId) {
        const certification = await certificationRepository.findById(organizationId, input.certificationId);
        if (!certification) throw new CertificationNotFoundError(input.certificationId);
        expiresAt = computeCertificationExpiry(input.completedAt, certification.validityMonths);
      }

      const timestamp = now();
      const completion: TrainingCompletion = {
        id: generateId('training-completion'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeId: input.employeeId,
        courseId: input.courseId,
        completedAt: input.completedAt,
        score: input.score,
        certificationId: input.certificationId,
        expiresAt,
      };
      await completionRepository.save(completion);
      eventBus?.publish('training.completed', {
        organizationId,
        trainingCompletionId: completion.id,
        employeeId: completion.employeeId,
        courseId: completion.courseId,
      });
      return completion;
    },

    async listCompletions(organizationId) {
      return completionRepository.findAll(organizationId);
    },

    async findCompletionsByEmployee(organizationId, employeeId) {
      return completionRepository.findByEmployee(organizationId, employeeId);
    },

    async findCompletionsByCourse(organizationId, courseId) {
      return completionRepository.findByCourse(organizationId, courseId);
    },
  };
}
