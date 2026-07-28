/**
 * Real Employee Management engine — profile, employee number,
 * employment status/type, and the guarded lifecycle: `hire`,
 * `transfer`, `promote`, `terminate`, `rehire`, plus `setOnLeave` /
 * `suspend` / `reactivate` for the remaining `EmploymentStatus`
 * values. Position headcount (`filledCount`) is kept in sync via the
 * injected {@link PositionManagementEngine} — intra-package
 * composition, never a second implementation of vacancy tracking.
 *
 * @module employee/engine.impl
 */
import type { DepartmentRepository } from '../department/repository.js';
import type { DepartmentId } from '../department/types.js';
import type { PositionManagementEngine } from '../position/engine.impl.js';
import type { PositionId } from '../position/types.js';
import type { HrEventBus } from '../events/hr-event-bus.js';
import { DepartmentNotFoundError, EmployeeNotFoundError, InvalidEmployeeTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { CurrencyCode, ISODate } from '../shared/primitives.js';
import type { EmployeeRepository } from './repository.js';
import type { Employee, EmploymentStatus, EmploymentType } from './types.js';

const EMPLOYEE_TRANSITIONS: Readonly<Record<EmploymentStatus, readonly EmploymentStatus[]>> = {
  active: ['on_leave', 'suspended', 'terminated'],
  on_leave: ['active', 'terminated'],
  suspended: ['active', 'terminated'],
  // Terminated is a dead end for ordinary transitions — rehire() is a
  // distinct operation that returns an employee directly to `active`.
  terminated: [],
};

/** Whether an employee may transition from one employment status to another via the ordinary lifecycle (not `rehire()`). */
export function canTransitionEmployee(from: EmploymentStatus, to: EmploymentStatus): boolean {
  return EMPLOYEE_TRANSITIONS[from].includes(to);
}

/** Pure: the next formatted employee number, derived from how many employees already exist. */
export function formatEmployeeNumber(existingCount: number): string {
  return `EMP-${String(existingCount + 1).padStart(5, '0')}`;
}

export interface HireEmployeeInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone?: string;
  readonly departmentId: DepartmentId;
  readonly positionId: PositionId;
  readonly managerId?: EmployeeId;
  readonly employmentType: EmploymentType;
  readonly baseSalary: string;
  readonly currency: CurrencyCode;
  readonly hireDate: ISODate;
}

export interface TransferEmployeeInput {
  readonly departmentId?: DepartmentId;
  readonly positionId?: PositionId;
  readonly managerId?: EmployeeId;
}

export interface PromoteEmployeeInput {
  readonly positionId: PositionId;
  readonly newBaseSalary?: string;
}

export interface TerminateEmployeeInput {
  readonly terminationDate: ISODate;
  readonly reason?: string;
}

export interface RehireEmployeeInput {
  readonly rehireDate: ISODate;
  readonly departmentId: DepartmentId;
  readonly positionId: PositionId;
}

export interface EmployeeManagementEngine {
  hire(organizationId: OrganizationId, input: HireEmployeeInput): Promise<Employee>;
  transfer(organizationId: OrganizationId, employeeId: EmployeeId, input: TransferEmployeeInput): Promise<Employee>;
  promote(organizationId: OrganizationId, employeeId: EmployeeId, input: PromoteEmployeeInput): Promise<Employee>;
  terminate(organizationId: OrganizationId, employeeId: EmployeeId, input: TerminateEmployeeInput): Promise<Employee>;
  rehire(organizationId: OrganizationId, employeeId: EmployeeId, input: RehireEmployeeInput): Promise<Employee>;
  setOnLeave(organizationId: OrganizationId, employeeId: EmployeeId): Promise<Employee>;
  suspend(organizationId: OrganizationId, employeeId: EmployeeId): Promise<Employee>;
  reactivate(organizationId: OrganizationId, employeeId: EmployeeId): Promise<Employee>;
  get(organizationId: OrganizationId, employeeId: EmployeeId): Promise<Employee | null>;
  list(organizationId: OrganizationId): Promise<readonly Employee[]>;
  findByDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Employee[]>;
  /** Direct reports — employees whose `managerId` is this employee. */
  findDirectReports(organizationId: OrganizationId, managerId: EmployeeId): Promise<readonly Employee[]>;
  /** The chain of managers from the employee's direct manager up to the top of the organization. */
  getManagementChain(organizationId: OrganizationId, employeeId: EmployeeId): Promise<readonly Employee[]>;
}

/** Creates a real {@link EmployeeManagementEngine}. */
export function createEmployeeManagementEngine(
  repository: EmployeeRepository,
  departmentRepository: DepartmentRepository,
  positions: PositionManagementEngine,
  eventBus?: HrEventBus,
  now: () => string = nowIso,
): EmployeeManagementEngine {
  async function requireEmployee(organizationId: OrganizationId, employeeId: EmployeeId): Promise<Employee> {
    const employee = await repository.findById(organizationId, employeeId);
    if (!employee) throw new EmployeeNotFoundError(employeeId);
    return employee;
  }

  async function requireDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<void> {
    const department = await departmentRepository.findById(organizationId, departmentId);
    if (!department) throw new DepartmentNotFoundError(departmentId);
  }

  async function transition(organizationId: OrganizationId, employeeId: EmployeeId, to: EmploymentStatus): Promise<Employee> {
    const employee = await requireEmployee(organizationId, employeeId);
    if (!canTransitionEmployee(employee.employmentStatus, to)) {
      throw new InvalidEmployeeTransitionError(employeeId, employee.employmentStatus, to);
    }
    const updated: Employee = { ...employee, employmentStatus: to, currentVersion: employee.currentVersion + 1, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async hire(organizationId, input) {
      await requireDepartment(organizationId, input.departmentId);
      await positions.incrementFilledCount(organizationId, input.positionId);

      const existingCount = (await repository.findAll(organizationId)).length;
      const timestamp = now();
      const employee: Employee = {
        id: generateId('employee'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        employeeNumber: formatEmployeeNumber(existingCount),
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        departmentId: input.departmentId,
        positionId: input.positionId,
        managerId: input.managerId,
        employmentType: input.employmentType,
        employmentStatus: 'active',
        baseSalary: input.baseSalary,
        currency: input.currency,
        hireDate: input.hireDate,
        currentVersion: 1,
      };
      await repository.save(employee);
      eventBus?.publish('employee.hired', { organizationId, employeeId: employee.id, departmentId: employee.departmentId, positionId: employee.positionId });
      return employee;
    },

    async transfer(organizationId, employeeId, input) {
      const employee = await requireEmployee(organizationId, employeeId);
      if (employee.employmentStatus === 'terminated') {
        throw new InvalidEmployeeTransitionError(employeeId, employee.employmentStatus, employee.employmentStatus);
      }
      if (input.departmentId) await requireDepartment(organizationId, input.departmentId);
      if (input.positionId && input.positionId !== employee.positionId) {
        await positions.incrementFilledCount(organizationId, input.positionId);
        await positions.decrementFilledCount(organizationId, employee.positionId);
      }
      const updated: Employee = {
        ...employee,
        departmentId: input.departmentId ?? employee.departmentId,
        positionId: input.positionId ?? employee.positionId,
        managerId: input.managerId ?? employee.managerId,
        currentVersion: employee.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('employee.transferred', { organizationId, employeeId, departmentId: updated.departmentId, positionId: updated.positionId });
      return updated;
    },

    async promote(organizationId, employeeId, input) {
      const employee = await requireEmployee(organizationId, employeeId);
      if (employee.employmentStatus !== 'active') {
        throw new InvalidEmployeeTransitionError(employeeId, employee.employmentStatus, employee.employmentStatus);
      }
      if (input.positionId !== employee.positionId) {
        await positions.incrementFilledCount(organizationId, input.positionId);
        await positions.decrementFilledCount(organizationId, employee.positionId);
      }
      const updated: Employee = {
        ...employee,
        positionId: input.positionId,
        baseSalary: input.newBaseSalary ?? employee.baseSalary,
        currentVersion: employee.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('employee.promoted', { organizationId, employeeId, positionId: updated.positionId });
      return updated;
    },

    async terminate(organizationId, employeeId, input) {
      const employee = await requireEmployee(organizationId, employeeId);
      if (!canTransitionEmployee(employee.employmentStatus, 'terminated')) {
        throw new InvalidEmployeeTransitionError(employeeId, employee.employmentStatus, 'terminated');
      }
      await positions.decrementFilledCount(organizationId, employee.positionId);
      const updated: Employee = {
        ...employee,
        employmentStatus: 'terminated',
        terminationDate: input.terminationDate,
        currentVersion: employee.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      eventBus?.publish('employee.terminated', { organizationId, employeeId });
      return updated;
    },

    async rehire(organizationId, employeeId, input) {
      const employee = await requireEmployee(organizationId, employeeId);
      if (employee.employmentStatus !== 'terminated') {
        throw new InvalidEmployeeTransitionError(employeeId, employee.employmentStatus, 'active');
      }
      await requireDepartment(organizationId, input.departmentId);
      await positions.incrementFilledCount(organizationId, input.positionId);
      const updated: Employee = {
        ...employee,
        employmentStatus: 'active',
        departmentId: input.departmentId,
        positionId: input.positionId,
        rehireDate: input.rehireDate,
        terminationDate: undefined,
        currentVersion: employee.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async setOnLeave(organizationId, employeeId) {
      return transition(organizationId, employeeId, 'on_leave');
    },

    async suspend(organizationId, employeeId) {
      return transition(organizationId, employeeId, 'suspended');
    },

    async reactivate(organizationId, employeeId) {
      return transition(organizationId, employeeId, 'active');
    },

    async get(organizationId, employeeId) {
      return repository.findById(organizationId, employeeId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByDepartment(organizationId, departmentId) {
      return repository.findByDepartment(organizationId, departmentId);
    },

    async findDirectReports(organizationId, managerId) {
      return repository.findByManager(organizationId, managerId);
    },

    async getManagementChain(organizationId, employeeId) {
      const chain: Employee[] = [];
      let current = await requireEmployee(organizationId, employeeId);
      while (current.managerId) {
        const manager = await requireEmployee(organizationId, current.managerId);
        chain.push(manager);
        current = manager;
      }
      return chain;
    },
  };
}
