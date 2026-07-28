/**
 * Real Material Planning engine — required/reserved quantity
 * bookkeeping and deterministic shortage detection for a project's
 * material needs. **Does not manage inventory directly** — the real
 * stock reservation is a genuine Inventory Engine movement, made only
 * through the Relationship Layer's `reserveProjectMaterial()`; this
 * engine only tracks the resulting numbers against the project.
 *
 * @module material/engine.impl
 */
import type { ProjectId } from '../project/types.js';
import { addAmounts, subtractAmounts, toMoney } from '../shared/decimal.js';
import { MaterialRequirementNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MaterialRequirementId, OrganizationId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';
import type { MaterialRequirementRepository } from './repository.js';
import type { MaterialRequirement } from './types.js';

/** `max(0, requiredQuantity - reservedQuantity)` — the unmet portion of a requirement. */
export function computeShortage(requiredQuantity: string, reservedQuantity: string): string {
  const shortfall = subtractAmounts(requiredQuantity, reservedQuantity);
  return Number.parseFloat(shortfall) > 0 ? shortfall : '0.00';
}

export interface CreateMaterialRequirementInput {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  readonly itemId: string;
  readonly warehouseId?: string;
  readonly requiredQuantity: string;
}

export interface MaterialPlanningEngine {
  createRequirement(organizationId: OrganizationId, input: CreateMaterialRequirementInput): Promise<MaterialRequirement>;
  recordReservation(organizationId: OrganizationId, requirementId: MaterialRequirementId, reservedQuantityDelta: string): Promise<MaterialRequirement>;
  fulfill(organizationId: OrganizationId, requirementId: MaterialRequirementId): Promise<MaterialRequirement>;
  cancel(organizationId: OrganizationId, requirementId: MaterialRequirementId): Promise<MaterialRequirement>;
  get(organizationId: OrganizationId, requirementId: MaterialRequirementId): Promise<MaterialRequirement | null>;
  list(organizationId: OrganizationId): Promise<readonly MaterialRequirement[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly MaterialRequirement[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly MaterialRequirement[]>;
  findByItem(organizationId: OrganizationId, itemId: string): Promise<readonly MaterialRequirement[]>;
  getShortage(organizationId: OrganizationId, requirementId: MaterialRequirementId): Promise<string>;
  listShortages(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly MaterialRequirement[]>;
}

/** Creates a real {@link MaterialPlanningEngine}. */
export function createMaterialPlanningEngine(repository: MaterialRequirementRepository, now: () => string = nowIso): MaterialPlanningEngine {
  async function requireRequirement(organizationId: OrganizationId, requirementId: MaterialRequirementId): Promise<MaterialRequirement> {
    const requirement = await repository.findById(organizationId, requirementId);
    if (!requirement) throw new MaterialRequirementNotFoundError(requirementId);
    return requirement;
  }

  return {
    async createRequirement(organizationId, input) {
      const timestamp = now();
      const requirement: MaterialRequirement = {
        id: generateId('material-requirement'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        projectId: input.projectId,
        taskId: input.taskId,
        itemId: input.itemId,
        warehouseId: input.warehouseId,
        requiredQuantity: toMoney(Number.parseFloat(input.requiredQuantity) || 0),
        reservedQuantity: '0.00',
        status: 'planned',
      };
      await repository.save(requirement);
      return requirement;
    },

    async recordReservation(organizationId, requirementId, reservedQuantityDelta) {
      const requirement = await requireRequirement(organizationId, requirementId);
      const reservedQuantity = addAmounts(requirement.reservedQuantity, reservedQuantityDelta);
      const status = Number.parseFloat(computeShortage(requirement.requiredQuantity, reservedQuantity)) === 0 ? 'reserved' : requirement.status;
      const updated: MaterialRequirement = { ...requirement, reservedQuantity, status, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async fulfill(organizationId, requirementId) {
      const requirement = await requireRequirement(organizationId, requirementId);
      const updated: MaterialRequirement = { ...requirement, status: 'fulfilled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async cancel(organizationId, requirementId) {
      const requirement = await requireRequirement(organizationId, requirementId);
      const updated: MaterialRequirement = { ...requirement, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, requirementId) {
      return repository.findById(organizationId, requirementId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },

    async findByProject(organizationId, projectId) {
      return repository.findByProject(organizationId, projectId);
    },

    async findByTask(organizationId, taskId) {
      return repository.findByTask(organizationId, taskId);
    },

    async findByItem(organizationId, itemId) {
      return repository.findByItem(organizationId, itemId);
    },

    async getShortage(organizationId, requirementId) {
      const requirement = await requireRequirement(organizationId, requirementId);
      return computeShortage(requirement.requiredQuantity, requirement.reservedQuantity);
    },

    async listShortages(organizationId, projectId) {
      const requirements = await repository.findByProject(organizationId, projectId);
      return requirements.filter((requirement) => Number.parseFloat(computeShortage(requirement.requiredQuantity, requirement.reservedQuantity)) > 0);
    },
  };
}
