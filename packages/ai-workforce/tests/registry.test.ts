import { describe, expect, it } from 'vitest';
import { createWorkerRepository } from '../src/worker/repository.impl.js';
import { createWorkerLifecycle } from '../src/worker/lifecycle.impl.js';
import { createWorkerRegistrationRepository, createWorkerRegistryRepository } from '../src/registry/repository.impl.js';
import { createWorkerRegistryService } from '../src/registry/service.impl.js';

const ORG = 'org-1';

function hireInput(overrides: Partial<{ roleCode: string }> = {}) {
  return {
    organizationId: ORG,
    businessDnaAgentId: 'agent-1',
    runtimeAgentId: 'runtime-agent-1',
    profile: {
      displayName: 'Ops Agent',
      title: 'AI Ops',
      workforceType: 'operations_ai' as const,
      proactiveEnabled: true,
      reactiveEnabled: true,
    },
    roles: [{ roleId: 'role-1', code: overrides.roleCode ?? 'operations_ai', name: 'Operations AI' }],
    capabilities: [{ capabilityId: 'cap-1', label: 'Reporting', proficiency: '0.80' }],
  };
}

function setup() {
  const workerRepository = createWorkerRepository();
  const lifecycle = createWorkerLifecycle(workerRepository);
  const registrationRepository = createWorkerRegistrationRepository();
  const registryRepository = createWorkerRegistryRepository();
  const registry = createWorkerRegistryService(workerRepository, registrationRepository, registryRepository, lifecycle);
  return { workerRepository, lifecycle, registrationRepository, registryRepository, registry };
}

describe('createWorkerRegistryService', () => {
  it('register() adds the worker to the org registry and creates an active registration', async () => {
    const { lifecycle, registry, registryRepository } = setup();
    const worker = await lifecycle.hire(hireInput());
    const registration = await registry.register(worker);

    expect(registration.status).toBe('active');
    expect(registration.workerId).toBe(worker.id);

    const org = await registryRepository.findByOrganization(ORG);
    expect(org?.workerIds).toContain(worker.id);
  });

  it('register() is idempotent for the same worker', async () => {
    const { lifecycle, registry } = setup();
    const worker = await lifecycle.hire(hireInput());
    const first = await registry.register(worker);
    const second = await registry.register(worker);
    expect(second.id).toBe(first.id);
  });

  it('update() merges profile fields and replaces roles/skills when provided', async () => {
    const { lifecycle, registry } = setup();
    const worker = await lifecycle.hire(hireInput());
    const updated = await registry.update(ORG, worker.id, {
      profile: { title: 'Senior AI Ops' },
      skills: [{ workerSkillId: 'ws-1', skillId: 'skill-1', name: 'Automation', level: 'advanced', score: '0.9' }],
    });
    expect(updated.profile.title).toBe('Senior AI Ops');
    expect(updated.profile.displayName).toBe('Ops Agent');
    expect(updated.skills).toHaveLength(1);
  });

  it('deactivate() suspends the worker and marks the registration suspended', async () => {
    const { lifecycle, registry, registrationRepository } = setup();
    const worker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, worker.id);
    await registry.register(worker);

    const deactivated = await registry.deactivate(ORG, worker.id);
    expect(deactivated.status).toBe('suspended');

    const registration = await registrationRepository.findByWorkerId(ORG, worker.id);
    expect(registration?.status).toBe('suspended');
  });

  it('findByRole() filters by role code', async () => {
    const { lifecycle, registry } = setup();
    await lifecycle.hire(hireInput({ roleCode: 'sales_ai' }));
    await lifecycle.hire(hireInput({ roleCode: 'operations_ai' }));

    const salesWorkers = await registry.findByRole(ORG, 'sales_ai');
    expect(salesWorkers).toHaveLength(1);
  });

  it('findByCapability() filters by capability id', async () => {
    const { lifecycle, registry } = setup();
    await lifecycle.hire(hireInput());
    const withoutCapability = await lifecycle.hire({ ...hireInput(), capabilities: [] });

    const withCapability = await registry.findByCapability(ORG, 'cap-1');
    expect(withCapability.map((w) => w.id)).not.toContain(withoutCapability.id);
    expect(withCapability).toHaveLength(1);
  });

  it('findByAvailability() defaults to "available" workers', async () => {
    const { lifecycle, registry } = setup();
    const draftWorker = await lifecycle.hire(hireInput());
    const activeWorker = await lifecycle.hire(hireInput());
    await lifecycle.activate(ORG, activeWorker.id);

    const available = await registry.findByAvailability(ORG);
    expect(available.map((w) => w.id)).toContain(activeWorker.id);
    expect(available.map((w) => w.id)).not.toContain(draftWorker.id);
  });

  it('findByOrganization() is organization-scoped', async () => {
    const { lifecycle, registry } = setup();
    await lifecycle.hire(hireInput());
    await lifecycle.hire({ ...hireInput(), organizationId: 'org-2' });

    const orgWorkers = await registry.findByOrganization(ORG);
    expect(orgWorkers).toHaveLength(1);
  });
});
