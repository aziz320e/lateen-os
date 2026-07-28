import { describe, expect, it } from 'vitest';
import { canTransitionPosition, computeVacancy, createPositionManagementEngine } from '../src/position/engine.impl.js';
import { createPositionRepository } from '../src/position/repository.impl.js';
import { InvalidPositionTransitionError, NoVacancyError, PositionNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';
const DEPT = 'department-1';

function setup() {
  const repository = createPositionRepository();
  const engine = createPositionManagementEngine(repository);
  return { repository, engine };
}

describe('computeVacancy (pure)', () => {
  it('computes remaining headcount', () => {
    expect(computeVacancy({ headcount: 5, filledCount: 2 })).toBe(3);
  });

  it('never goes negative', () => {
    expect(computeVacancy({ headcount: 2, filledCount: 5 })).toBe(0);
  });
});

describe('canTransitionPosition (pure)', () => {
  it('allows active -> archived', () => {
    expect(canTransitionPosition('active', 'archived')).toBe(true);
  });

  it('rejects any transition out of archived', () => {
    expect(canTransitionPosition('archived', 'active')).toBe(false);
  });
});

describe('PositionManagementEngine — create', () => {
  it('creates an active position with filledCount 0', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Software Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 3,
    });
    expect(position.status).toBe('active');
    expect(position.filledCount).toBe(0);
  });
});

describe('PositionManagementEngine — update', () => {
  it('bumps version on update', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    const updated = await engine.update(ORG, position.id, { headcount: 4 });
    expect(updated.headcount).toBe(4);
    expect(updated.currentVersion).toBe(2);
  });

  it('rejects updating an archived position', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    await engine.archive(ORG, position.id);
    await expect(engine.update(ORG, position.id, { headcount: 5 })).rejects.toBeInstanceOf(InvalidPositionTransitionError);
  });

  it('throws PositionNotFoundError for an unknown position', async () => {
    const { engine } = setup();
    await expect(engine.update(ORG, 'missing', {})).rejects.toBeInstanceOf(PositionNotFoundError);
  });
});

describe('PositionManagementEngine — archive/restore', () => {
  it('archive() moves active -> archived', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    const archived = await engine.archive(ORG, position.id);
    expect(archived.status).toBe('archived');
  });

  it('restore() moves archived -> active', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    await engine.archive(ORG, position.id);
    const restored = await engine.restore(ORG, position.id);
    expect(restored.status).toBe('active');
  });

  it('rejects restore() on a non-archived position', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    await expect(engine.restore(ORG, position.id)).rejects.toBeInstanceOf(InvalidPositionTransitionError);
  });
});

describe('PositionManagementEngine — vacancy tracking', () => {
  it('incrementFilledCount() fills a vacancy', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    const updated = await engine.incrementFilledCount(ORG, position.id);
    expect(updated.filledCount).toBe(1);
  });

  it('incrementFilledCount() throws NoVacancyError once full', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 1,
    });
    await engine.incrementFilledCount(ORG, position.id);
    await expect(engine.incrementFilledCount(ORG, position.id)).rejects.toBeInstanceOf(NoVacancyError);
  });

  it('decrementFilledCount() never goes below 0', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, {
      title: 'Engineer',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 2,
    });
    const updated = await engine.decrementFilledCount(ORG, position.id);
    expect(updated.filledCount).toBe(0);
  });

  it('listVacancies() returns only positions with unfilled slots', async () => {
    const { engine } = setup();
    const full = await engine.create(ORG, {
      title: 'Full',
      departmentId: DEPT,
      jobGrade: 'G3',
      salaryGrade: 'S3',
      baseSalary: '6000.00',
      currency: 'USD',
      headcount: 1,
    });
    await engine.incrementFilledCount(ORG, full.id);
    await engine.create(ORG, { title: 'Open', departmentId: DEPT, jobGrade: 'G3', salaryGrade: 'S3', baseSalary: '6000.00', currency: 'USD', headcount: 2 });
    const vacancies = await engine.listVacancies(ORG);
    expect(vacancies).toHaveLength(1);
    expect(vacancies[0]?.title).toBe('Open');
  });
});

describe('PositionManagementEngine — update fields individually', () => {
  it('updates title, jobGrade, salaryGrade, and baseSalary independently', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, { title: 'Engineer', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 1 });
    const updated = await engine.update(ORG, position.id, { title: 'Senior Engineer', jobGrade: 'G2', salaryGrade: 'S2', baseSalary: '7000.00' });
    expect(updated.title).toBe('Senior Engineer');
    expect(updated.jobGrade).toBe('G2');
    expect(updated.salaryGrade).toBe('S2');
    expect(updated.baseSalary).toBe('7000.00');
  });

  it('preserves fields not included in the patch', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, { title: 'Engineer', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 1 });
    const updated = await engine.update(ORG, position.id, { title: 'Senior Engineer' });
    expect(updated.jobGrade).toBe('G1');
    expect(updated.baseSalary).toBe('5000.00');
  });
});

describe('PositionManagementEngine — headcount reduction below filledCount', () => {
  it('allows reducing headcount below the current filledCount without adjusting filledCount', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, { title: 'Engineer', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 3 });
    await engine.incrementFilledCount(ORG, position.id);
    await engine.incrementFilledCount(ORG, position.id);
    const updated = await engine.update(ORG, position.id, { headcount: 1 });
    expect(updated.filledCount).toBe(2);
    expect(computeVacancy(updated)).toBe(0);
  });
});

describe('PositionManagementEngine — vacancy tracking across multiple cycles', () => {
  it('a position can be filled and vacated repeatedly', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, { title: 'Engineer', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 1 });
    await engine.incrementFilledCount(ORG, position.id);
    await engine.decrementFilledCount(ORG, position.id);
    const refilled = await engine.incrementFilledCount(ORG, position.id);
    expect(refilled.filledCount).toBe(1);
  });

  it('listVacancies() is based purely on headcount vs filledCount, regardless of status', async () => {
    const { engine } = setup();
    const position = await engine.create(ORG, { title: 'Engineer', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '5000.00', currency: 'USD', headcount: 2 });
    await engine.archive(ORG, position.id);
    const vacancies = await engine.listVacancies(ORG);
    expect(vacancies.some((p) => p.id === position.id)).toBe(true);
  });
});

describe('PositionManagementEngine — get/list/findByDepartment/org scoping', () => {
  it('get() returns null for an unknown position', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('findByDepartment() filters by department', async () => {
    const { engine } = setup();
    await engine.create(ORG, { title: 'A', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '1000.00', currency: 'USD', headcount: 1 });
    await engine.create(ORG, { title: 'B', departmentId: 'department-2', jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '1000.00', currency: 'USD', headcount: 1 });
    expect(await engine.findByDepartment(ORG, DEPT)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, repository } = setup();
    const position = await engine.create(ORG, { title: 'A', departmentId: DEPT, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '1000.00', currency: 'USD', headcount: 1 });
    expect(await repository.findById('org-2', position.id)).toBeNull();
  });
});
