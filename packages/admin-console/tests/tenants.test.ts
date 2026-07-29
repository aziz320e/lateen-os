import { describe, expect, it } from 'vitest';
import { createAdminEventBus } from '../src/events/index.js';
import { canTransitionTenant, createTenantEngine } from '../src/tenants/engine.impl.js';
import { createEnvironmentRepository, createTenantRepository } from '../src/tenants/repository.impl.js';
import { EnvironmentNotFoundError, InvalidTenantTransitionError, TenantNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createAdminEventBus();
  const engine = createTenantEngine(createTenantRepository(), createEnvironmentRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionTenant (pure)', () => {
  it('active -> suspended | archived', () => {
    expect(canTransitionTenant('active', 'suspended')).toBe(true);
    expect(canTransitionTenant('active', 'archived')).toBe(true);
  });

  it('suspended -> active | archived', () => {
    expect(canTransitionTenant('suspended', 'active')).toBe(true);
    expect(canTransitionTenant('suspended', 'archived')).toBe(true);
  });

  it('archived is terminal', () => {
    expect(canTransitionTenant('archived', 'active')).toBe(false);
  });
});

describe('TenantEngine — Tenant Registry', () => {
  it('createTenant() starts at active status', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    expect(tenant.status).toBe('active');
  });

  it('publishes tenant.created', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('tenant.created', (payload) => (seen = payload));
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    expect(seen).toEqual({ organizationId: ORG, tenantId: tenant.id, name: 'Tenant One' });
  });

  it('suspendTenant() -> reactivateTenant() -> archiveTenant() progresses the lifecycle', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const suspended = await engine.suspendTenant(ORG, tenant.id);
    expect(suspended.status).toBe('suspended');
    const reactivated = await engine.reactivateTenant(ORG, tenant.id);
    expect(reactivated.status).toBe('active');
    const archived = await engine.archiveTenant(ORG, tenant.id);
    expect(archived.status).toBe('archived');
  });

  it('rejects archiveTenant() called twice', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    await engine.archiveTenant(ORG, tenant.id);
    await expect(engine.archiveTenant(ORG, tenant.id)).rejects.toBeInstanceOf(InvalidTenantTransitionError);
  });

  it('suspendTenant() throws TenantNotFoundError for an unknown tenant', async () => {
    const { engine } = setup();
    await expect(engine.suspendTenant(ORG, 'missing')).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it('getTenant()/listTenants() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.getTenant(ORG, 'missing')).toBeNull();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    expect(await engine.getTenant(ORG, tenant.id)).toEqual(tenant);
    expect(await engine.listTenants(ORG)).toHaveLength(1);
  });

  it('tenants are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createTenant(ORG, { name: 'Tenant One' });
    await engine.createTenant('org-2', { name: 'Tenant One' });
    expect(await engine.listTenants(ORG)).toHaveLength(1);
    expect(await engine.listTenants('org-2')).toHaveLength(1);
  });
});

describe('TenantEngine — Environment Registry', () => {
  it('createEnvironment() succeeds when the tenant exists, starting at active status', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const environment = await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Staging', environmentType: 'staging' });
    expect(environment.status).toBe('active');
    expect(environment.tenantId).toBe(tenant.id);
  });

  it('createEnvironment() throws TenantNotFoundError for an unknown tenant', async () => {
    const { engine } = setup();
    await expect(engine.createEnvironment(ORG, { tenantId: 'missing', name: 'Staging', environmentType: 'staging' })).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it('disableEnvironment() / enableEnvironment() toggle status', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const environment = await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Staging', environmentType: 'staging' });
    const disabled = await engine.disableEnvironment(ORG, environment.id);
    expect(disabled.status).toBe('disabled');
    const enabled = await engine.enableEnvironment(ORG, environment.id);
    expect(enabled.status).toBe('active');
  });

  it('disableEnvironment() throws EnvironmentNotFoundError for an unknown environment', async () => {
    const { engine } = setup();
    await expect(engine.disableEnvironment(ORG, 'missing')).rejects.toBeInstanceOf(EnvironmentNotFoundError);
  });

  it('getEnvironment() / listEnvironmentsForTenant() / listAllEnvironments() work as expected', async () => {
    const { engine } = setup();
    const tenantA = await engine.createTenant(ORG, { name: 'Tenant A' });
    const tenantB = await engine.createTenant(ORG, { name: 'Tenant B' });
    const envA = await engine.createEnvironment(ORG, { tenantId: tenantA.id, name: 'Prod A', environmentType: 'production' });
    await engine.createEnvironment(ORG, { tenantId: tenantB.id, name: 'Prod B', environmentType: 'production' });

    expect(await engine.getEnvironment(ORG, envA.id)).toEqual(envA);
    expect(await engine.listEnvironmentsForTenant(ORG, tenantA.id)).toEqual([envA]);
    expect(await engine.listAllEnvironments(ORG)).toHaveLength(2);
  });

  it('supports every environment type', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const types = ['development', 'staging', 'production'] as const;
    for (const environmentType of types) {
      const environment = await engine.createEnvironment(ORG, { tenantId: tenant.id, name: environmentType, environmentType });
      expect(environment.environmentType).toBe(environmentType);
    }
  });

  it('environments are isolated per organization', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Staging', environmentType: 'staging' });
    expect(await engine.listAllEnvironments('org-2')).toEqual([]);
  });

  it('suspended -> archived is a valid direct tenant transition', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    await engine.suspendTenant(ORG, tenant.id);
    const archived = await engine.archiveTenant(ORG, tenant.id);
    expect(archived.status).toBe('archived');
  });

  it('reactivateTenant() throws InvalidTenantTransitionError when already active', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    await expect(engine.reactivateTenant(ORG, tenant.id)).rejects.toBeInstanceOf(InvalidTenantTransitionError);
  });

  it('getEnvironment() returns null for an unknown environment', async () => {
    const { engine } = setup();
    expect(await engine.getEnvironment(ORG, 'missing')).toBeNull();
  });

  it('listEnvironmentsForTenant() is empty for a tenant with no environments', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    expect(await engine.listEnvironmentsForTenant(ORG, tenant.id)).toEqual([]);
  });

  it('a disabled environment can be re-enabled and remains associated with its tenant', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const environment = await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Prod', environmentType: 'production' });
    await engine.disableEnvironment(ORG, environment.id);
    const enabled = await engine.enableEnvironment(ORG, environment.id);
    expect(enabled.tenantId).toBe(tenant.id);
  });

  it('a tenant can have multiple environments of different types', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Dev', environmentType: 'development' });
    await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Prod', environmentType: 'production' });
    expect(await engine.listEnvironmentsForTenant(ORG, tenant.id)).toHaveLength(2);
  });

  it('archiving a tenant does not implicitly disable its environments', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    const environment = await engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Prod', environmentType: 'production' });
    await engine.archiveTenant(ORG, tenant.id);
    expect((await engine.getEnvironment(ORG, environment.id))?.status).toBe('active');
  });

  it('enableEnvironment() throws EnvironmentNotFoundError for an unknown environment', async () => {
    const { engine } = setup();
    await expect(engine.enableEnvironment(ORG, 'missing')).rejects.toBeInstanceOf(EnvironmentNotFoundError);
  });

  it('tenant names are not required to be unique within an organization', async () => {
    const { engine } = setup();
    const first = await engine.createTenant(ORG, { name: 'Same Name' });
    const second = await engine.createTenant(ORG, { name: 'Same Name' });
    expect(first.id).not.toBe(second.id);
  });

  it('createEnvironment() throws TenantNotFoundError when the tenant belongs to a different organization', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant('org-2', { name: 'Tenant One' });
    await expect(engine.createEnvironment(ORG, { tenantId: tenant.id, name: 'Prod', environmentType: 'production' })).rejects.toBeInstanceOf(TenantNotFoundError);
  });

  it('getTenant() returns null for a tenant id from a different organization', async () => {
    const { engine } = setup();
    const tenant = await engine.createTenant(ORG, { name: 'Tenant One' });
    expect(await engine.getTenant('org-2', tenant.id)).toBeNull();
  });
});
