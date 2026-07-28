import { describe, expect, it } from 'vitest';
import { createOrganizationStructureEngine } from '../src/department/engine.impl.js';
import { createDepartmentRepository } from '../src/department/repository.impl.js';
import { canTransitionEmployee, createEmployeeManagementEngine, formatEmployeeNumber } from '../src/employee/engine.impl.js';
import { createEmployeeRepository } from '../src/employee/repository.impl.js';
import { createHrEventBus } from '../src/events/index.js';
import { createPositionManagementEngine } from '../src/position/engine.impl.js';
import { createPositionRepository } from '../src/position/repository.impl.js';
import { EmployeeNotFoundError, InvalidEmployeeTransitionError, NoVacancyError } from '../src/shared/errors.js';

const ORG = 'org-1';

async function setup(eventBus = createHrEventBus()) {
  const employeeRepository = createEmployeeRepository();
  const departmentRepository = createDepartmentRepository();
  const positionRepository = createPositionRepository();
  const departments = createOrganizationStructureEngine(departmentRepository);
  const positions = createPositionManagementEngine(positionRepository);
  const engine = createEmployeeManagementEngine(employeeRepository, departmentRepository, positions, eventBus);

  const department = await departments.create(ORG, { code: 'ENG', name: 'Engineering', unitType: 'department' });
  const position = await positions.create(ORG, {
    title: 'Software Engineer',
    departmentId: department.id,
    jobGrade: 'G3',
    salaryGrade: 'S3',
    baseSalary: '6000.00',
    currency: 'USD',
    headcount: 2,
  });
  const otherPosition = await positions.create(ORG, {
    title: 'Senior Software Engineer',
    departmentId: department.id,
    jobGrade: 'G4',
    salaryGrade: 'S4',
    baseSalary: '8000.00',
    currency: 'USD',
    headcount: 2,
  });

  return { employeeRepository, departmentRepository, positionRepository, departments, positions, engine, department, position, otherPosition, eventBus };
}

function hireInput(departmentId: string, positionId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    departmentId,
    positionId,
    employmentType: 'full_time' as const,
    baseSalary: '6000.00',
    currency: 'USD',
    hireDate: '2026-01-01',
    ...overrides,
  };
}

describe('formatEmployeeNumber (pure)', () => {
  it('formats a 5-digit, prefixed employee number', () => {
    expect(formatEmployeeNumber(0)).toBe('EMP-00001');
    expect(formatEmployeeNumber(41)).toBe('EMP-00042');
  });
});

describe('canTransitionEmployee (pure)', () => {
  it('allows active -> on_leave/suspended/terminated', () => {
    expect(canTransitionEmployee('active', 'on_leave')).toBe(true);
    expect(canTransitionEmployee('active', 'suspended')).toBe(true);
    expect(canTransitionEmployee('active', 'terminated')).toBe(true);
  });

  it('allows on_leave/suspended back to active', () => {
    expect(canTransitionEmployee('on_leave', 'active')).toBe(true);
    expect(canTransitionEmployee('suspended', 'active')).toBe(true);
  });

  it('rejects any transition out of terminated — rehire() is a distinct operation', () => {
    expect(canTransitionEmployee('terminated', 'active')).toBe(false);
  });
});

describe('EmployeeManagementEngine — hire', () => {
  it('hires an employee at status active with the first employee number', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    expect(employee.employmentStatus).toBe('active');
    expect(employee.employeeNumber).toBe('EMP-00001');
  });

  it('increments position filledCount on hire', async () => {
    const { engine, positions, department, position } = await setup();
    await engine.hire(ORG, hireInput(department.id, position.id));
    const updated = await positions.get(ORG, position.id);
    expect(updated?.filledCount).toBe(1);
  });

  it('publishes employee.hired', async () => {
    const eventBus = createHrEventBus();
    const { engine, department, position } = await setup(eventBus);
    let seen: unknown;
    eventBus.subscribe('employee.hired', (payload) => (seen = payload));
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    expect(seen).toEqual({ organizationId: ORG, employeeId: employee.id, departmentId: department.id, positionId: position.id });
  });

  it('throws NoVacancyError when the position is full', async () => {
    const { engine, positions, department, position } = await setup();
    await positions.update(ORG, position.id, { headcount: 1 });
    await engine.hire(ORG, hireInput(department.id, position.id));
    await expect(engine.hire(ORG, hireInput(department.id, position.id))).rejects.toBeInstanceOf(NoVacancyError);
  });

  it('sequential hires get sequential employee numbers', async () => {
    const { engine, department, position, otherPosition } = await setup();
    const first = await engine.hire(ORG, hireInput(department.id, position.id));
    const second = await engine.hire(ORG, hireInput(department.id, otherPosition.id));
    expect(first.employeeNumber).toBe('EMP-00001');
    expect(second.employeeNumber).toBe('EMP-00002');
  });
});

describe('EmployeeManagementEngine — transfer', () => {
  it('moves department/position and adjusts vacancy counts on both positions', async () => {
    const { engine, positions, department, position, otherPosition } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const transferred = await engine.transfer(ORG, employee.id, { positionId: otherPosition.id });
    expect(transferred.positionId).toBe(otherPosition.id);
    expect((await positions.get(ORG, position.id))?.filledCount).toBe(0);
    expect((await positions.get(ORG, otherPosition.id))?.filledCount).toBe(1);
  });

  it('publishes employee.transferred', async () => {
    const eventBus = createHrEventBus();
    const { engine, department, position, otherPosition } = await setup(eventBus);
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    let seen: unknown;
    eventBus.subscribe('employee.transferred', (payload) => (seen = payload));
    await engine.transfer(ORG, employee.id, { positionId: otherPosition.id });
    expect(seen).toEqual({ organizationId: ORG, employeeId: employee.id, departmentId: department.id, positionId: otherPosition.id });
  });

  it('rejects transferring a terminated employee', async () => {
    const { engine, department, position, otherPosition } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.terminate(ORG, employee.id, { terminationDate: '2026-02-01' });
    await expect(engine.transfer(ORG, employee.id, { positionId: otherPosition.id })).rejects.toBeInstanceOf(InvalidEmployeeTransitionError);
  });

  it('updates managerId', async () => {
    const { engine, department, position } = await setup();
    const manager = await engine.hire(ORG, hireInput(department.id, position.id));
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const transferred = await engine.transfer(ORG, employee.id, { managerId: manager.id });
    expect(transferred.managerId).toBe(manager.id);
  });
});

describe('EmployeeManagementEngine — promote', () => {
  it('changes position and salary, adjusting vacancy counts', async () => {
    const { engine, positions, department, position, otherPosition } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const promoted = await engine.promote(ORG, employee.id, { positionId: otherPosition.id, newBaseSalary: '8500.00' });
    expect(promoted.positionId).toBe(otherPosition.id);
    expect(promoted.baseSalary).toBe('8500.00');
    expect((await positions.get(ORG, position.id))?.filledCount).toBe(0);
    expect((await positions.get(ORG, otherPosition.id))?.filledCount).toBe(1);
  });

  it('publishes employee.promoted', async () => {
    const eventBus = createHrEventBus();
    const { engine, department, position, otherPosition } = await setup(eventBus);
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    let seen: unknown;
    eventBus.subscribe('employee.promoted', (payload) => (seen = payload));
    await engine.promote(ORG, employee.id, { positionId: otherPosition.id });
    expect(seen).toEqual({ organizationId: ORG, employeeId: employee.id, positionId: otherPosition.id });
  });

  it('rejects promoting a non-active employee', async () => {
    const { engine, department, position, otherPosition } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.setOnLeave(ORG, employee.id);
    await expect(engine.promote(ORG, employee.id, { positionId: otherPosition.id })).rejects.toBeInstanceOf(InvalidEmployeeTransitionError);
  });
});

describe('EmployeeManagementEngine — terminate/rehire', () => {
  it('terminate() sets status terminated, stamps terminationDate, frees the position, and publishes employee.terminated', async () => {
    const eventBus = createHrEventBus();
    const { engine, positions, department, position } = await setup(eventBus);
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    let seen: unknown;
    eventBus.subscribe('employee.terminated', (payload) => (seen = payload));
    const terminated = await engine.terminate(ORG, employee.id, { terminationDate: '2026-03-01' });
    expect(terminated.employmentStatus).toBe('terminated');
    expect(terminated.terminationDate).toBe('2026-03-01');
    expect((await positions.get(ORG, position.id))?.filledCount).toBe(0);
    expect(seen).toEqual({ organizationId: ORG, employeeId: employee.id });
  });

  it('rejects terminating an already-terminated employee', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.terminate(ORG, employee.id, { terminationDate: '2026-03-01' });
    await expect(engine.terminate(ORG, employee.id, { terminationDate: '2026-03-02' })).rejects.toBeInstanceOf(InvalidEmployeeTransitionError);
  });

  it('rehire() reactivates a terminated employee and re-fills a position', async () => {
    const { engine, positions, department, position, otherPosition } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.terminate(ORG, employee.id, { terminationDate: '2026-03-01' });
    const rehired = await engine.rehire(ORG, employee.id, { rehireDate: '2026-06-01', departmentId: department.id, positionId: otherPosition.id });
    expect(rehired.employmentStatus).toBe('active');
    expect(rehired.rehireDate).toBe('2026-06-01');
    expect(rehired.terminationDate).toBeUndefined();
    expect((await positions.get(ORG, otherPosition.id))?.filledCount).toBe(1);
  });

  it('rejects rehiring a non-terminated employee', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await expect(engine.rehire(ORG, employee.id, { rehireDate: '2026-06-01', departmentId: department.id, positionId: position.id })).rejects.toBeInstanceOf(
      InvalidEmployeeTransitionError,
    );
  });

  it('throws EmployeeNotFoundError for an unknown employee', async () => {
    const { engine } = await setup();
    await expect(engine.terminate(ORG, 'missing', { terminationDate: '2026-01-01' })).rejects.toBeInstanceOf(EmployeeNotFoundError);
  });
});

describe('EmployeeManagementEngine — setOnLeave/suspend/reactivate', () => {
  it('setOnLeave() moves active -> on_leave', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const onLeave = await engine.setOnLeave(ORG, employee.id);
    expect(onLeave.employmentStatus).toBe('on_leave');
  });

  it('suspend() moves active -> suspended', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const suspended = await engine.suspend(ORG, employee.id);
    expect(suspended.employmentStatus).toBe('suspended');
  });

  it('reactivate() moves on_leave/suspended back to active', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.suspend(ORG, employee.id);
    const reactivated = await engine.reactivate(ORG, employee.id);
    expect(reactivated.employmentStatus).toBe('active');
  });

  it('rejects setOnLeave() on a terminated employee', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.terminate(ORG, employee.id, { terminationDate: '2026-01-01' });
    await expect(engine.setOnLeave(ORG, employee.id)).rejects.toBeInstanceOf(InvalidEmployeeTransitionError);
  });
});

describe('EmployeeManagementEngine — reporting hierarchy', () => {
  it('findDirectReports() finds employees managed by a given employee', async () => {
    const { engine, department, position } = await setup();
    const manager = await engine.hire(ORG, hireInput(department.id, position.id));
    const report = await engine.hire(ORG, hireInput(department.id, position.id, { managerId: manager.id }));
    const reports = await engine.findDirectReports(ORG, manager.id);
    expect(reports.map((r) => r.id)).toEqual([report.id]);
  });

  it('getManagementChain() walks up to the top of the organization', async () => {
    const { engine, positions, department, position } = await setup();
    await positions.update(ORG, position.id, { headcount: 3 });
    const topManager = await engine.hire(ORG, hireInput(department.id, position.id));
    const middleManager = await engine.hire(ORG, hireInput(department.id, position.id, { managerId: topManager.id }));
    const employee = await engine.hire(ORG, hireInput(department.id, position.id, { managerId: middleManager.id }));
    const chain = await engine.getManagementChain(ORG, employee.id);
    expect(chain.map((m) => m.id)).toEqual([middleManager.id, topManager.id]);
  });

  it('getManagementChain() is empty for an employee with no manager', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    expect(await engine.getManagementChain(ORG, employee.id)).toEqual([]);
  });
});

describe('EmployeeManagementEngine — hire validates the department', () => {
  it('throws DepartmentNotFoundError for an unknown department', async () => {
    const { engine, position } = await setup();
    await expect(engine.hire(ORG, hireInput('missing-department', position.id))).rejects.toThrow();
  });
});

describe('EmployeeManagementEngine — transfer without a position change', () => {
  it('does not touch position filledCount when only managerId changes', async () => {
    const { engine, positions, department, position } = await setup();
    const manager = await engine.hire(ORG, hireInput(department.id, position.id));
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.transfer(ORG, employee.id, { managerId: manager.id });
    expect((await positions.get(ORG, position.id))?.filledCount).toBe(2);
  });
});

describe('EmployeeManagementEngine — promote without a position change', () => {
  it('only updates salary when positionId is unchanged', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    const promoted = await engine.promote(ORG, employee.id, { positionId: position.id, newBaseSalary: '7000.00' });
    expect(promoted.baseSalary).toBe('7000.00');
    expect(promoted.positionId).toBe(position.id);
  });
});

describe('EmployeeManagementEngine — findDirectReports returns empty for an employee with no reports', () => {
  it('is an empty array', async () => {
    const { engine, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    expect(await engine.findDirectReports(ORG, employee.id)).toEqual([]);
  });
});

describe('EmployeeManagementEngine — rehire to a different department', () => {
  it('rehire() can move the employee to a new department', async () => {
    const { engine, departments, positions, department, position } = await setup();
    const otherDepartment = await departments.create(ORG, { code: 'SALES', name: 'Sales', unitType: 'department' });
    const otherPosition = await positions.create(ORG, { title: 'Sales Rep', departmentId: otherDepartment.id, jobGrade: 'G1', salaryGrade: 'S1', baseSalary: '4000.00', currency: 'USD', headcount: 2 });
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    await engine.terminate(ORG, employee.id, { terminationDate: '2026-02-01' });
    const rehired = await engine.rehire(ORG, employee.id, { rehireDate: '2026-03-01', departmentId: otherDepartment.id, positionId: otherPosition.id });
    expect(rehired.departmentId).toBe(otherDepartment.id);
    expect(rehired.positionId).toBe(otherPosition.id);
  });
});

describe('EmployeeManagementEngine — get/list/findByDepartment/org scoping', () => {
  it('get() returns null for an unknown employee', async () => {
    const { engine } = await setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
  });

  it('list() and findByDepartment() round-trip', async () => {
    const { engine, department, position } = await setup();
    await engine.hire(ORG, hireInput(department.id, position.id));
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.findByDepartment(ORG, department.id)).toHaveLength(1);
  });

  it('is organization-scoped', async () => {
    const { engine, employeeRepository, department, position } = await setup();
    const employee = await engine.hire(ORG, hireInput(department.id, position.id));
    expect(await employeeRepository.findById('org-2', employee.id)).toBeNull();
  });
});
