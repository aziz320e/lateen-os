/**
 * Real Organization Structure engine — departments, business units,
 * and divisions with hierarchy traversal (reporting hierarchy) and
 * manager relationships, guarded by a create/update/archive/restore
 * lifecycle.
 *
 * @module department/engine.impl
 */
import { DepartmentNotFoundError, InvalidDepartmentTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { DepartmentId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { DepartmentRepository } from './repository.js';
import type { Department, DepartmentStatus, UnitType } from './types.js';

const DEPARTMENT_TRANSITIONS: Readonly<Record<DepartmentStatus, readonly DepartmentStatus[]>> = {
  active: ['archived'],
  archived: [],
};

/** Whether a department may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionDepartment(from: DepartmentStatus, to: DepartmentStatus): boolean {
  return DEPARTMENT_TRANSITIONS[from].includes(to);
}

export interface CreateDepartmentInput {
  readonly code: string;
  readonly name: string;
  readonly unitType: UnitType;
  readonly parentDepartmentId?: DepartmentId;
  readonly managerId?: EmployeeId;
  readonly description?: string;
}

export interface UpdateDepartmentInput {
  readonly name?: string;
  readonly managerId?: EmployeeId;
  readonly description?: string;
  readonly parentDepartmentId?: DepartmentId;
}

export interface OrganizationStructureEngine {
  create(organizationId: OrganizationId, input: CreateDepartmentInput): Promise<Department>;
  update(organizationId: OrganizationId, departmentId: DepartmentId, input: UpdateDepartmentInput): Promise<Department>;
  archive(organizationId: OrganizationId, departmentId: DepartmentId): Promise<Department>;
  restore(organizationId: OrganizationId, departmentId: DepartmentId): Promise<Department>;
  get(organizationId: OrganizationId, departmentId: DepartmentId): Promise<Department | null>;
  list(organizationId: OrganizationId): Promise<readonly Department[]>;
  /** Direct children in the reporting hierarchy. */
  getChildren(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Department[]>;
  /** Every descendant, at any depth. */
  getDescendants(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Department[]>;
  /** The chain of ancestors from the immediate parent up to the root. */
  getAncestors(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Department[]>;
  findByManager(organizationId: OrganizationId, managerId: EmployeeId): Promise<readonly Department[]>;
}

/** Creates a real {@link OrganizationStructureEngine} backed by a {@link DepartmentRepository}. */
export function createOrganizationStructureEngine(
  repository: DepartmentRepository,
  now: () => string = nowIso,
): OrganizationStructureEngine {
  async function requireDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<Department> {
    const department = await repository.findById(organizationId, departmentId);
    if (!department) throw new DepartmentNotFoundError(departmentId);
    return department;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const department: Department = {
        id: generateId('department'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        code: input.code,
        name: input.name,
        unitType: input.unitType,
        parentDepartmentId: input.parentDepartmentId,
        managerId: input.managerId,
        description: input.description,
        status: 'active',
        currentVersion: 1,
      };
      await repository.save(department);
      return department;
    },

    async update(organizationId, departmentId, input) {
      const department = await requireDepartment(organizationId, departmentId);
      if (department.status === 'archived') {
        throw new InvalidDepartmentTransitionError(departmentId, department.status, department.status);
      }
      const updated: Department = {
        ...department,
        name: input.name ?? department.name,
        managerId: input.managerId ?? department.managerId,
        description: input.description ?? department.description,
        parentDepartmentId: input.parentDepartmentId ?? department.parentDepartmentId,
        currentVersion: department.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, departmentId) {
      const department = await requireDepartment(organizationId, departmentId);
      if (!canTransitionDepartment(department.status, 'archived')) {
        throw new InvalidDepartmentTransitionError(departmentId, department.status, 'archived');
      }
      const updated: Department = { ...department, status: 'archived', currentVersion: department.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async restore(organizationId, departmentId) {
      const department = await requireDepartment(organizationId, departmentId);
      if (department.status !== 'archived') {
        throw new InvalidDepartmentTransitionError(departmentId, department.status, 'active');
      }
      const updated: Department = { ...department, status: 'active', currentVersion: department.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, departmentId) {
      return repository.findById(organizationId, departmentId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async getChildren(organizationId, departmentId) {
      return repository.findByParent(organizationId, departmentId);
    },

    async getDescendants(organizationId, departmentId) {
      const descendants: Department[] = [];
      const queue = [...(await repository.findByParent(organizationId, departmentId))];
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) continue;
        descendants.push(next);
        queue.push(...(await repository.findByParent(organizationId, next.id)));
      }
      return descendants;
    },

    async getAncestors(organizationId, departmentId) {
      const ancestors: Department[] = [];
      let current = await requireDepartment(organizationId, departmentId);
      while (current.parentDepartmentId) {
        const parent = await requireDepartment(organizationId, current.parentDepartmentId);
        ancestors.unshift(parent);
        current = parent;
      }
      return ancestors;
    },

    async findByManager(organizationId, managerId) {
      return repository.findByManager(organizationId, managerId);
    },
  };
}
