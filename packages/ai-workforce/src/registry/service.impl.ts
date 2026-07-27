/**
 * Real Worker Registry service — registers, updates, deactivates, and
 * discovers workers across an organization's workforce.
 *
 * @module registry/service.impl
 */
import type { WorkerLifecycleService } from '../worker/lifecycle.impl.js';
import type { WorkerRepository } from '../worker/repository.js';
import type {
  AIWorker,
  AvailabilityState,
  WorkerCapability,
  WorkerId,
  WorkerProfile,
  WorkerRole,
  WorkerSkill,
} from '../worker/types.js';
import type { ToolAccessGrant, WorkerCertification } from '../skills/types.js';
import { WorkerNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { WorkerRegistrationRepository, WorkerRegistryRepository } from './repository.js';
import type { WorkerRegistration } from './types.js';

export interface WorkerUpdate {
  readonly profile?: Partial<WorkerProfile>;
  readonly roles?: readonly WorkerRole[];
  readonly capabilities?: readonly WorkerCapability[];
  readonly skills?: readonly WorkerSkill[];
  readonly certifications?: readonly WorkerCertification[];
  readonly toolAccess?: readonly ToolAccessGrant[];
}

export interface WorkerRegistryService {
  register(worker: AIWorker): Promise<WorkerRegistration>;
  update(organizationId: OrganizationId, workerId: WorkerId, patch: WorkerUpdate): Promise<AIWorker>;
  deactivate(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker>;
  findByRole(organizationId: OrganizationId, roleCode: string): Promise<readonly AIWorker[]>;
  findByCapability(organizationId: OrganizationId, capabilityId: string): Promise<readonly AIWorker[]>;
  findByAvailability(organizationId: OrganizationId, state?: AvailabilityState): Promise<readonly AIWorker[]>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly AIWorker[]>;
}

/** Creates a real {@link WorkerRegistryService} over the worker and registry repositories. */
export function createWorkerRegistryService(
  workerRepository: WorkerRepository,
  registrationRepository: WorkerRegistrationRepository,
  registryRepository: WorkerRegistryRepository,
  lifecycle: WorkerLifecycleService,
  now: () => string = nowIso,
): WorkerRegistryService {
  async function requireWorker(organizationId: OrganizationId, workerId: WorkerId): Promise<AIWorker> {
    const worker = await workerRepository.findById(organizationId, workerId);
    if (!worker) throw new WorkerNotFoundError(workerId);
    return worker;
  }

  return {
    async register(worker) {
      const timestamp = now();
      const existingRegistry = await registryRepository.findByOrganization(worker.organizationId);
      const workerIds = existingRegistry ? Array.from(new Set([...existingRegistry.workerIds, worker.id])) : [worker.id];
      await registryRepository.save({
        organizationId: worker.organizationId,
        workerIds,
        updatedAt: timestamp,
      });

      const existingRegistration = await registrationRepository.findByWorkerId(worker.organizationId, worker.id);
      if (existingRegistration) return existingRegistration;

      const registration: WorkerRegistration = {
        id: generateId('registration'),
        organizationId: worker.organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        workerId: worker.id,
        workforceType: worker.profile.workforceType,
        status: 'active',
      };
      await registrationRepository.save(registration);
      return registration;
    },

    async update(organizationId, workerId, patch) {
      const worker = await requireWorker(organizationId, workerId);
      const updated: AIWorker = {
        ...worker,
        profile: patch.profile ? { ...worker.profile, ...patch.profile } : worker.profile,
        roles: patch.roles ?? worker.roles,
        capabilities: patch.capabilities ?? worker.capabilities,
        skills: patch.skills ?? worker.skills,
        certifications: patch.certifications ?? worker.certifications,
        toolAccess: patch.toolAccess ?? worker.toolAccess,
        updatedAt: now(),
      };
      await workerRepository.save(updated);
      return updated;
    },

    async deactivate(organizationId, workerId) {
      const deactivated = await lifecycle.suspend(organizationId, workerId, 'deactivated via registry');
      const registration = await registrationRepository.findByWorkerId(organizationId, workerId);
      if (registration) {
        await registrationRepository.save({ ...registration, status: 'suspended', updatedAt: now() });
      }
      return deactivated;
    },

    async findByRole(organizationId, roleCode) {
      const workers = await workerRepository.findAll(organizationId);
      return workers.filter((worker) => worker.roles.some((role) => role.code === roleCode));
    },

    async findByCapability(organizationId, capabilityId) {
      const workers = await workerRepository.findAll(organizationId);
      return workers.filter((worker) => worker.capabilities.some((capability) => capability.capabilityId === capabilityId));
    },

    async findByAvailability(organizationId, state = 'available') {
      const workers = await workerRepository.findAll(organizationId);
      return workers.filter((worker) => worker.availability.state === state);
    },

    async findByOrganization(organizationId) {
      return workerRepository.findAll(organizationId);
    },
  };
}
