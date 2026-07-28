/**
 * Real Position Management engine — positions, job grades, salary
 * grades, and deterministic vacancy tracking (`headcount -
 * filledCount`). `filledCount` is adjusted only by the Employee
 * Management engine's hire/transfer/promotion/termination/rehire
 * operations (intra-package composition) — never mutated directly by
 * callers.
 *
 * @module position/engine.impl
 */
import type { DepartmentId } from '../department/types.js';
import { InvalidPositionTransitionError, NoVacancyError, PositionNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, PositionId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';
import type { PositionRepository } from './repository.js';
import type { Position, PositionStatus } from './types.js';

const POSITION_TRANSITIONS: Readonly<Record<PositionStatus, readonly PositionStatus[]>> = {
  active: ['archived'],
  archived: [],
};

/** Whether a position may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionPosition(from: PositionStatus, to: PositionStatus): boolean {
  return POSITION_TRANSITIONS[from].includes(to);
}

/** Pure: remaining, unfilled headcount for a position. Never negative. */
export function computeVacancy(position: Pick<Position, 'headcount' | 'filledCount'>): number {
  return Math.max(0, position.headcount - position.filledCount);
}

export interface CreatePositionInput {
  readonly title: string;
  readonly departmentId: DepartmentId;
  readonly jobGrade: string;
  readonly salaryGrade: string;
  readonly baseSalary: string;
  readonly currency: CurrencyCode;
  readonly headcount: number;
}

export interface UpdatePositionInput {
  readonly title?: string;
  readonly jobGrade?: string;
  readonly salaryGrade?: string;
  readonly baseSalary?: string;
  readonly headcount?: number;
}

export interface PositionManagementEngine {
  create(organizationId: OrganizationId, input: CreatePositionInput): Promise<Position>;
  update(organizationId: OrganizationId, positionId: PositionId, input: UpdatePositionInput): Promise<Position>;
  archive(organizationId: OrganizationId, positionId: PositionId): Promise<Position>;
  restore(organizationId: OrganizationId, positionId: PositionId): Promise<Position>;
  get(organizationId: OrganizationId, positionId: PositionId): Promise<Position | null>;
  list(organizationId: OrganizationId): Promise<readonly Position[]>;
  findByDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<readonly Position[]>;
  /** Every position with at least one unfilled slot (`filledCount < headcount`). */
  listVacancies(organizationId: OrganizationId): Promise<readonly Position[]>;
  /** Throws {@link NoVacancyError} if the position has no remaining vacancy. */
  incrementFilledCount(organizationId: OrganizationId, positionId: PositionId): Promise<Position>;
  decrementFilledCount(organizationId: OrganizationId, positionId: PositionId): Promise<Position>;
}

/** Creates a real {@link PositionManagementEngine} backed by a {@link PositionRepository}. */
export function createPositionManagementEngine(
  repository: PositionRepository,
  now: () => string = nowIso,
): PositionManagementEngine {
  async function requirePosition(organizationId: OrganizationId, positionId: PositionId): Promise<Position> {
    const position = await repository.findById(organizationId, positionId);
    if (!position) throw new PositionNotFoundError(positionId);
    return position;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const position: Position = {
        id: generateId('position'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        departmentId: input.departmentId,
        jobGrade: input.jobGrade,
        salaryGrade: input.salaryGrade,
        baseSalary: input.baseSalary,
        currency: input.currency,
        headcount: input.headcount,
        filledCount: 0,
        status: 'active',
        currentVersion: 1,
      };
      await repository.save(position);
      return position;
    },

    async update(organizationId, positionId, input) {
      const position = await requirePosition(organizationId, positionId);
      if (position.status === 'archived') {
        throw new InvalidPositionTransitionError(positionId, position.status, position.status);
      }
      const updated: Position = {
        ...position,
        title: input.title ?? position.title,
        jobGrade: input.jobGrade ?? position.jobGrade,
        salaryGrade: input.salaryGrade ?? position.salaryGrade,
        baseSalary: input.baseSalary ?? position.baseSalary,
        headcount: input.headcount ?? position.headcount,
        currentVersion: position.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async archive(organizationId, positionId) {
      const position = await requirePosition(organizationId, positionId);
      if (!canTransitionPosition(position.status, 'archived')) {
        throw new InvalidPositionTransitionError(positionId, position.status, 'archived');
      }
      const updated: Position = { ...position, status: 'archived', currentVersion: position.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async restore(organizationId, positionId) {
      const position = await requirePosition(organizationId, positionId);
      if (position.status !== 'archived') {
        throw new InvalidPositionTransitionError(positionId, position.status, 'active');
      }
      const updated: Position = { ...position, status: 'active', currentVersion: position.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, positionId) {
      return repository.findById(organizationId, positionId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByDepartment(organizationId, departmentId) {
      return repository.findByDepartment(organizationId, departmentId);
    },

    async listVacancies(organizationId) {
      const positions = await repository.findAll(organizationId);
      return positions.filter((position) => computeVacancy(position) > 0);
    },

    async incrementFilledCount(organizationId, positionId) {
      const position = await requirePosition(organizationId, positionId);
      if (computeVacancy(position) <= 0) throw new NoVacancyError(positionId);
      const updated: Position = { ...position, filledCount: position.filledCount + 1, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async decrementFilledCount(organizationId, positionId) {
      const position = await requirePosition(organizationId, positionId);
      const updated: Position = { ...position, filledCount: Math.max(0, position.filledCount - 1), updatedAt: now() };
      await repository.save(updated);
      return updated;
    },
  };
}
