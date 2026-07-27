/**
 * Real Compliance Framework Registry — create/update/activate/
 * deactivate/archive/restore lifecycle plus full version history for
 * the eight supported compliance frameworks.
 *
 * @module framework/engine.impl
 */
import type { ComplianceEventBus } from '../events/compliance-event-bus.js';
import { ComplianceFrameworkNotFoundError, InvalidFrameworkTransitionError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ComplianceFrameworkId, OrganizationId } from '../shared/identifiers.js';
import type { ComplianceFrameworkRepository, ComplianceFrameworkVersionRepository } from './repository.js';
import type {
  ComplianceControlType,
  ComplianceFramework,
  ComplianceFrameworkCode,
  ComplianceFrameworkStatus,
  ComplianceFrameworkVersion,
} from './types.js';

const ALL_CONTROL_TYPES: readonly ComplianceControlType[] = ['administrative', 'technical', 'operational', 'physical'];

const FRAMEWORK_TRANSITIONS: Readonly<Record<ComplianceFrameworkStatus, readonly ComplianceFrameworkStatus[]>> = {
  draft: ['active', 'archived'],
  active: ['inactive', 'archived'],
  inactive: ['active', 'archived'],
  // Archived is a dead end for ordinary transitions — restore() is a distinct
  // operation (below) that returns a framework to its pre-archive status
  // without going through this table.
  archived: [],
};

/** Whether a compliance framework may transition from one status to another via the ordinary lifecycle (not `restore()`). */
export function canTransitionFramework(from: ComplianceFrameworkStatus, to: ComplianceFrameworkStatus): boolean {
  return FRAMEWORK_TRANSITIONS[from].includes(to);
}

export interface CreateFrameworkInput {
  readonly frameworkCode: ComplianceFrameworkCode;
  readonly name: string;
  readonly description?: string;
  readonly requiredControlTypes?: readonly ComplianceControlType[];
}

export interface UpdateFrameworkInput {
  readonly name?: string;
  readonly description?: string;
  readonly requiredControlTypes?: readonly ComplianceControlType[];
}

export interface ComplianceFrameworkEngine {
  create(organizationId: OrganizationId, input: CreateFrameworkInput): Promise<ComplianceFramework>;
  update(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId, input: UpdateFrameworkInput): Promise<ComplianceFramework>;
  activate(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework>;
  deactivate(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework>;
  archive(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework>;
  restore(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework>;
  get(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework | null>;
  getVersionHistory(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<readonly ComplianceFrameworkVersion[]>;
}

/** Creates a real {@link ComplianceFrameworkEngine} backed by the framework and framework-version repositories. */
export function createComplianceFrameworkEngine(
  repository: ComplianceFrameworkRepository,
  versionRepository: ComplianceFrameworkVersionRepository,
  eventBus?: ComplianceEventBus,
  now: () => string = nowIso,
): ComplianceFrameworkEngine {
  async function requireFramework(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId): Promise<ComplianceFramework> {
    const framework = await repository.findById(organizationId, frameworkId);
    if (!framework) throw new ComplianceFrameworkNotFoundError(frameworkId);
    return framework;
  }

  async function snapshot(framework: ComplianceFramework): Promise<void> {
    const version: ComplianceFrameworkVersion = {
      id: generateId('framework-version'),
      organizationId: framework.organizationId,
      createdAt: framework.updatedAt,
      updatedAt: framework.updatedAt,
      frameworkId: framework.id,
      version: framework.currentVersion,
      name: framework.name,
      description: framework.description,
      requiredControlTypes: framework.requiredControlTypes,
      status: framework.status,
    };
    await versionRepository.save(version);
  }

  async function transition(organizationId: OrganizationId, frameworkId: ComplianceFrameworkId, to: ComplianceFrameworkStatus): Promise<ComplianceFramework> {
    const framework = await requireFramework(organizationId, frameworkId);
    if (!canTransitionFramework(framework.status, to)) {
      throw new InvalidFrameworkTransitionError(frameworkId, framework.status, to);
    }
    const updated: ComplianceFramework = {
      ...framework,
      status: to,
      statusBeforeArchive: to === 'archived' ? framework.status : framework.statusBeforeArchive,
      currentVersion: framework.currentVersion + 1,
      updatedAt: now(),
    };
    await repository.save(updated);
    await snapshot(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const framework: ComplianceFramework = {
        id: generateId('compliance-framework'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        frameworkCode: input.frameworkCode,
        name: input.name,
        description: input.description,
        requiredControlTypes: input.requiredControlTypes ?? ALL_CONTROL_TYPES,
        status: 'draft',
        currentVersion: 1,
      };
      await repository.save(framework);
      await snapshot(framework);
      eventBus?.publish('framework.created', { organizationId, frameworkId: framework.id, frameworkCode: framework.frameworkCode });
      return framework;
    },

    async update(organizationId, frameworkId, input) {
      const framework = await requireFramework(organizationId, frameworkId);
      if (framework.status === 'archived') {
        throw new InvalidFrameworkTransitionError(frameworkId, framework.status, framework.status);
      }
      const updated: ComplianceFramework = {
        ...framework,
        name: input.name ?? framework.name,
        description: input.description ?? framework.description,
        requiredControlTypes: input.requiredControlTypes ?? framework.requiredControlTypes,
        currentVersion: framework.currentVersion + 1,
        updatedAt: now(),
      };
      await repository.save(updated);
      await snapshot(updated);
      eventBus?.publish('framework.updated', { organizationId, frameworkId });
      return updated;
    },

    async activate(organizationId, frameworkId) {
      return transition(organizationId, frameworkId, 'active');
    },

    async deactivate(organizationId, frameworkId) {
      return transition(organizationId, frameworkId, 'inactive');
    },

    async archive(organizationId, frameworkId) {
      return transition(organizationId, frameworkId, 'archived');
    },

    async restore(organizationId, frameworkId) {
      const framework = await requireFramework(organizationId, frameworkId);
      if (framework.status !== 'archived') {
        throw new InvalidFrameworkTransitionError(frameworkId, framework.status, framework.statusBeforeArchive ?? 'draft');
      }
      const to = framework.statusBeforeArchive ?? 'draft';
      const updated: ComplianceFramework = { ...framework, status: to, currentVersion: framework.currentVersion + 1, updatedAt: now() };
      await repository.save(updated);
      await snapshot(updated);
      return updated;
    },

    async get(organizationId, frameworkId) {
      return repository.findById(organizationId, frameworkId);
    },

    async getVersionHistory(organizationId, frameworkId) {
      return versionRepository.findByFrameworkId(organizationId, frameworkId);
    },
  };
}
