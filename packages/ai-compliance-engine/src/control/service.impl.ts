/**
 * Real Compliance Controls service — create/update/approve/retire
 * lifecycle across the four required control types (administrative,
 * technical, operational, physical).
 *
 * @module control/service.impl
 */
import { ComplianceControlNotFoundError, InvalidControlTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceControlId, ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceControlRepository } from './repository.js';
import type { ComplianceControl, ComplianceControlStatus, ComplianceControlType, ControlImplementationStatus } from './types.js';

const CONTROL_TRANSITIONS: Readonly<Record<ComplianceControlStatus, readonly ComplianceControlStatus[]>> = {
  draft: ['approved', 'retired'],
  approved: ['retired'],
  retired: [],
};

/** Whether a compliance control may transition from one status to another. */
export function canTransitionControl(from: ComplianceControlStatus, to: ComplianceControlStatus): boolean {
  return CONTROL_TRANSITIONS[from].includes(to);
}

export interface CreateControlInput {
  readonly controlType: ComplianceControlType;
  readonly name: string;
  readonly description?: string;
  readonly frameworkId?: ComplianceFrameworkId;
  readonly implementationStatus?: ControlImplementationStatus;
  readonly expiresAt?: string;
}

export interface UpdateControlInput {
  readonly name?: string;
  readonly description?: string;
  readonly implementationStatus?: ControlImplementationStatus;
  readonly expiresAt?: string;
}

export interface ComplianceControlService {
  create(organizationId: OrganizationId, input: CreateControlInput): Promise<ComplianceControl>;
  update(organizationId: OrganizationId, controlId: ComplianceControlId, input: UpdateControlInput): Promise<ComplianceControl>;
  approve(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<ComplianceControl>;
  retire(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<ComplianceControl>;
  get(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<ComplianceControl | null>;
}

/** Creates a real {@link ComplianceControlService} backed by a {@link ComplianceControlRepository}. */
export function createComplianceControlService(
  repository: ComplianceControlRepository,
  now: () => string = nowIso,
): ComplianceControlService {
  async function requireControl(organizationId: OrganizationId, controlId: ComplianceControlId): Promise<ComplianceControl> {
    const control = await repository.findById(organizationId, controlId);
    if (!control) throw new ComplianceControlNotFoundError(controlId);
    return control;
  }

  async function transition(organizationId: OrganizationId, controlId: ComplianceControlId, to: ComplianceControlStatus): Promise<ComplianceControl> {
    const control = await requireControl(organizationId, controlId);
    if (!canTransitionControl(control.status, to)) {
      throw new InvalidControlTransitionError(controlId, control.status, to);
    }
    const updated: ComplianceControl = { ...control, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const control: ComplianceControl = {
        id: generateId('compliance-control'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkId: input.frameworkId,
        controlType: input.controlType,
        name: input.name,
        description: input.description,
        status: 'draft',
        implementationStatus: input.implementationStatus ?? 'not_implemented',
        expiresAt: input.expiresAt,
      };
      await repository.save(control);
      return control;
    },

    async update(organizationId, controlId, input) {
      const control = await requireControl(organizationId, controlId);
      if (control.status === 'retired') {
        throw new InvalidControlTransitionError(controlId, control.status, control.status);
      }
      const updated: ComplianceControl = {
        ...control,
        name: input.name ?? control.name,
        description: input.description ?? control.description,
        implementationStatus: input.implementationStatus ?? control.implementationStatus,
        expiresAt: input.expiresAt ?? control.expiresAt,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async approve(organizationId, controlId) {
      return transition(organizationId, controlId, 'approved');
    },

    async retire(organizationId, controlId) {
      return transition(organizationId, controlId, 'retired');
    },

    async get(organizationId, controlId) {
      return repository.findById(organizationId, controlId);
    },
  };
}
