import { describe, expect, it } from 'vitest';
import { createHrEventBus } from '../src/events/index.js';
import { CertificationNotFoundError, CourseNotFoundError } from '../src/shared/errors.js';
import { computeCertificationExpiry, createTrainingEngine } from '../src/training/engine.impl.js';
import {
  createCertificationRepository,
  createCourseRepository,
  createEmployeeSkillRepository,
  createTrainingCompletionRepository,
} from '../src/training/repository.impl.js';

const ORG = 'org-1';
const EMPLOYEE = 'employee-1';

function setup(eventBus = createHrEventBus()) {
  const courseRepository = createCourseRepository();
  const certificationRepository = createCertificationRepository();
  const skillRepository = createEmployeeSkillRepository();
  const completionRepository = createTrainingCompletionRepository();
  const engine = createTrainingEngine(courseRepository, certificationRepository, skillRepository, completionRepository, eventBus);
  return { courseRepository, certificationRepository, skillRepository, completionRepository, engine, eventBus };
}

describe('computeCertificationExpiry (pure)', () => {
  it('adds validityMonths to the completion date', () => {
    expect(computeCertificationExpiry('2026-01-15', 12)).toBe('2027-01-15');
  });

  it('is undefined when validityMonths is undefined (never expires)', () => {
    expect(computeCertificationExpiry('2026-01-15', undefined)).toBeUndefined();
  });
});

describe('TrainingEngine — courses', () => {
  it('createCourse() starts active', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    expect(course.status).toBe('active');
  });

  it('archiveCourse() moves active -> archived', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    const archived = await engine.archiveCourse(ORG, course.id);
    expect(archived.status).toBe('archived');
  });

  it('throws CourseNotFoundError for an unknown course', async () => {
    const { engine } = setup();
    await expect(engine.archiveCourse(ORG, 'missing')).rejects.toBeInstanceOf(CourseNotFoundError);
  });

  it('getCourse()/listCourses() round-trip', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    expect(await engine.getCourse(ORG, course.id)).toEqual(course);
    expect(await engine.listCourses(ORG)).toHaveLength(1);
  });
});

describe('TrainingEngine — certifications', () => {
  it('createCertification() supports an optional validityMonths', async () => {
    const { engine } = setup();
    const certification = await engine.createCertification(ORG, { name: 'AWS Certified', issuingBody: 'AWS', validityMonths: 36 });
    expect(certification.validityMonths).toBe(36);
  });

  it('getCertification()/listCertifications() round-trip', async () => {
    const { engine } = setup();
    const certification = await engine.createCertification(ORG, { name: 'AWS Certified' });
    expect(await engine.getCertification(ORG, certification.id)).toEqual(certification);
    expect(await engine.listCertifications(ORG)).toHaveLength(1);
  });
});

describe('TrainingEngine — skills', () => {
  it('recordSkill() creates a new skill record', async () => {
    const { engine } = setup();
    const skill = await engine.recordSkill(ORG, { employeeId: EMPLOYEE, skillName: 'TypeScript', proficiency: 'advanced' });
    expect(skill.proficiency).toBe('advanced');
  });

  it('recordSkill() upserts (updates) an existing skill record rather than duplicating it', async () => {
    const { engine } = setup();
    const first = await engine.recordSkill(ORG, { employeeId: EMPLOYEE, skillName: 'TypeScript', proficiency: 'intermediate' });
    const second = await engine.recordSkill(ORG, { employeeId: EMPLOYEE, skillName: 'TypeScript', proficiency: 'expert' });
    expect(second.id).toBe(first.id);
    expect(second.proficiency).toBe('expert');
    const all = await engine.findSkillsByEmployee(ORG, EMPLOYEE);
    expect(all).toHaveLength(1);
  });

  it('supports all four proficiency levels', async () => {
    const { engine } = setup();
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
    for (const proficiency of levels) {
      const skill = await engine.recordSkill(ORG, { employeeId: EMPLOYEE, skillName: `skill-${proficiency}`, proficiency });
      expect(skill.proficiency).toBe(proficiency);
    }
  });
});

describe('TrainingEngine — findSkillsByEmployee for an employee with no recorded skills', () => {
  it('is an empty array', async () => {
    const { engine } = setup();
    expect(await engine.findSkillsByEmployee(ORG, EMPLOYEE)).toEqual([]);
  });
});

describe('TrainingEngine — certifications without expiry', () => {
  it('a certification with no validityMonths never expires across completions', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Ethics', durationHours: 1 });
    const certification = await engine.createCertification(ORG, { name: 'Ethics Cert' });
    const completion = await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-01', certificationId: certification.id });
    expect(completion.expiresAt).toBeUndefined();
  });
});

describe('TrainingEngine — completions', () => {
  it('recordCompletion() without a certification has no expiresAt', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    const completion = await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15', score: 95 });
    expect(completion.expiresAt).toBeUndefined();
  });

  it('recordCompletion() with a validity-limited certification computes expiresAt', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'AWS Course', durationHours: 8 });
    const certification = await engine.createCertification(ORG, { name: 'AWS Certified', validityMonths: 12 });
    const completion = await engine.recordCompletion(ORG, {
      employeeId: EMPLOYEE,
      courseId: course.id,
      completedAt: '2026-01-15',
      certificationId: certification.id,
    });
    expect(completion.expiresAt).toBe('2027-01-15');
  });

  it('publishes training.completed', async () => {
    const eventBus = createHrEventBus();
    const { engine } = setup(eventBus);
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    let seen: unknown;
    eventBus.subscribe('training.completed', (payload) => (seen = payload));
    const completion = await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15' });
    expect(seen).toEqual({ organizationId: ORG, trainingCompletionId: completion.id, employeeId: EMPLOYEE, courseId: course.id });
  });

  it('throws CourseNotFoundError for an unknown course', async () => {
    const { engine } = setup();
    await expect(engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: 'missing', completedAt: '2026-01-15' })).rejects.toBeInstanceOf(
      CourseNotFoundError,
    );
  });

  it('throws CertificationNotFoundError for an unknown certification', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    await expect(
      engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15', certificationId: 'missing' }),
    ).rejects.toBeInstanceOf(CertificationNotFoundError);
  });

  it('recordCompletion() stores an optional score', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    const completion = await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15', score: 88 });
    expect(completion.score).toBe(88);
  });

  it('is organization-scoped', async () => {
    const { engine, completionRepository } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    const completion = await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15' });
    expect(await completionRepository.findById('org-2', completion.id)).toBeNull();
  });

  it('listCompletions()/findCompletionsByEmployee()/findCompletionsByCourse() round-trip', async () => {
    const { engine } = setup();
    const course = await engine.createCourse(ORG, { title: 'Security Awareness', durationHours: 2 });
    await engine.recordCompletion(ORG, { employeeId: EMPLOYEE, courseId: course.id, completedAt: '2026-01-15' });
    expect(await engine.listCompletions(ORG)).toHaveLength(1);
    expect(await engine.findCompletionsByEmployee(ORG, EMPLOYEE)).toHaveLength(1);
    expect(await engine.findCompletionsByCourse(ORG, course.id)).toHaveLength(1);
  });
});
