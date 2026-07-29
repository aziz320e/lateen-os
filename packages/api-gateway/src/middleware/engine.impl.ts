/**
 * Real Middleware Pipeline engine — a named, ordered set of pipeline
 * stages. This module only owns configuration (name, sequence, kind,
 * enabled); actually executing authentication/authorization/
 * validation/rate-limiting in that order is the Runtime Dispatcher's
 * job, composing the respective engines.
 *
 * @module middleware/engine.impl
 */
import { MiddlewareStepNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { MiddlewareStepId, OrganizationId } from '../shared/identifiers.js';
import type { MiddlewareStepRepository } from './repository.js';
import type { MiddlewareStep, MiddlewareStepKind } from './types.js';

/** Sorts steps by ascending `sequence`, ties broken by id for full determinism. */
export function orderSteps(steps: readonly MiddlewareStep[]): readonly MiddlewareStep[] {
  return [...steps].sort((a, b) => (a.sequence !== b.sequence ? a.sequence - b.sequence : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export interface RegisterMiddlewareStepInput {
  readonly name: string;
  readonly sequence: number;
  readonly kind: MiddlewareStepKind;
  readonly enabled?: boolean;
}

export interface MiddlewarePipelineEngine {
  registerStep(organizationId: OrganizationId, input: RegisterMiddlewareStepInput): Promise<MiddlewareStep>;
  enableStep(organizationId: OrganizationId, stepId: MiddlewareStepId): Promise<MiddlewareStep>;
  disableStep(organizationId: OrganizationId, stepId: MiddlewareStepId): Promise<MiddlewareStep>;
  getOrderedSteps(organizationId: OrganizationId): Promise<readonly MiddlewareStep[]>;
  getEnabledOrderedSteps(organizationId: OrganizationId): Promise<readonly MiddlewareStep[]>;
  get(organizationId: OrganizationId, stepId: MiddlewareStepId): Promise<MiddlewareStep | null>;
  list(organizationId: OrganizationId): Promise<readonly MiddlewareStep[]>;
}

/** Creates a real {@link MiddlewarePipelineEngine}. */
export function createMiddlewarePipelineEngine(repository: MiddlewareStepRepository, now: () => string = nowIso): MiddlewarePipelineEngine {
  async function requireStep(organizationId: OrganizationId, stepId: MiddlewareStepId): Promise<MiddlewareStep> {
    const step = await repository.findById(organizationId, stepId);
    if (!step) throw new MiddlewareStepNotFoundError(stepId);
    return step;
  }

  return {
    async registerStep(organizationId, input) {
      const timestamp = now();
      const step: MiddlewareStep = {
        id: generateId('middleware-step'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        sequence: input.sequence,
        kind: input.kind,
        enabled: input.enabled ?? true,
      };
      await repository.save(step);
      return step;
    },

    async enableStep(organizationId, stepId) {
      const step = await requireStep(organizationId, stepId);
      const updated: MiddlewareStep = { ...step, enabled: true, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async disableStep(organizationId, stepId) {
      const step = await requireStep(organizationId, stepId);
      const updated: MiddlewareStep = { ...step, enabled: false, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getOrderedSteps(organizationId) {
      return orderSteps(await repository.findAll(organizationId));
    },

    async getEnabledOrderedSteps(organizationId) {
      return orderSteps((await repository.findAll(organizationId)).filter((step) => step.enabled));
    },

    async get(organizationId, stepId) {
      return repository.findById(organizationId, stepId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
