import { describe, expect, it } from 'vitest';
import { createServiceDiscoveryEngine } from '../src/discovery/engine.impl.js';
import { createServiceRegistrationRepository } from '../src/discovery/repository.impl.js';
import { ServiceRegistrationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createServiceDiscoveryEngine(createServiceRegistrationRepository()) };
}

describe('ServiceDiscoveryEngine', () => {
  it('registerService() creates a new registration as available', async () => {
    const { engine } = setup();
    const registration = await engine.registerService(ORG, 'crm-engine');
    expect(registration.status).toBe('available');
    expect(registration.serviceName).toBe('crm-engine');
  });

  it('registerService() is idempotent for an already-registered service', async () => {
    const { engine } = setup();
    const first = await engine.registerService(ORG, 'crm-engine');
    const second = await engine.registerService(ORG, 'crm-engine');
    expect(second.id).toBe(first.id);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('markUnavailable() / markAvailable() toggle status', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    const unavailable = await engine.markUnavailable(ORG, 'crm-engine');
    expect(unavailable.status).toBe('unavailable');
    const available = await engine.markAvailable(ORG, 'crm-engine');
    expect(available.status).toBe('available');
  });

  it('markUnavailable() throws ServiceRegistrationNotFoundError for an unregistered service', async () => {
    const { engine } = setup();
    await expect(engine.markUnavailable(ORG, 'unknown')).rejects.toBeInstanceOf(ServiceRegistrationNotFoundError);
  });

  it('isAvailable() reflects the current status', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    expect(await engine.isAvailable(ORG, 'crm-engine')).toBe(true);
    await engine.markUnavailable(ORG, 'crm-engine');
    expect(await engine.isAvailable(ORG, 'crm-engine')).toBe(false);
  });

  it('isAvailable() is false for a service that was never registered', async () => {
    const { engine } = setup();
    expect(await engine.isAvailable(ORG, 'unknown')).toBe(false);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'unknown')).toBeNull();
    const registration = await engine.registerService(ORG, 'crm-engine');
    expect(await engine.get(ORG, 'crm-engine')).toEqual(registration);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('registrations are isolated per organization', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    await engine.registerService('org-2', 'crm-engine');
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('registerService() called again after markUnavailable() does not reset status back to available', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    await engine.markUnavailable(ORG, 'crm-engine');
    const reRegistered = await engine.registerService(ORG, 'crm-engine');
    expect(reRegistered.status).toBe('unavailable');
  });

  it('markAvailable() throws ServiceRegistrationNotFoundError for a never-registered service', async () => {
    const { engine } = setup();
    await expect(engine.markAvailable(ORG, 'unknown')).rejects.toBeInstanceOf(ServiceRegistrationNotFoundError);
  });

  it('list() reflects multiple independently registered services', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    await engine.registerService(ORG, 'finance-engine');
    await engine.registerService(ORG, 'hr-engine');
    expect((await engine.list(ORG)).map((registration) => registration.serviceName).sort()).toEqual(['crm-engine', 'finance-engine', 'hr-engine']);
  });

  it('get() reflects the current status after markUnavailable()', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    await engine.markUnavailable(ORG, 'crm-engine');
    expect((await engine.get(ORG, 'crm-engine'))?.status).toBe('unavailable');
  });

  it('markUnavailable() followed by markAvailable() fully restores availability', async () => {
    const { engine } = setup();
    await engine.registerService(ORG, 'crm-engine');
    await engine.markUnavailable(ORG, 'crm-engine');
    await engine.markAvailable(ORG, 'crm-engine');
    expect(await engine.isAvailable(ORG, 'crm-engine')).toBe(true);
  });

  it('list() returns an empty array for an organization with no registered services', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });
});
