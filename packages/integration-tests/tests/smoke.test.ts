/**
 * End-to-end smoke tests for the Phase 3 business-scenario validation.
 * Fast and shallow by design (unlike the scenario tests, which are deep
 * narrative flows): this just proves the seeded world is real, complete,
 * and that every one of the ten runtimes it composes is genuinely
 * reachable through its own real query layer — catching gross breakage
 * (a missing engine wire-up, a broken seed step) quickly.
 */
import { describe, expect, it } from 'vitest';
import { createSeededWorld } from './business-fixtures.js';

describe('Smoke: deterministic seed data is real and complete', () => {
  it('creates a real organization with a business profile', async () => {
    const world = await createSeededWorld();
    expect(world.organization.id).toBe(world.organizationId);
    expect(world.organization.status).toBe('draft');
    const profile = await world.runtimes.businessDna.businessProfile.get(world.organizationId);
    expect(profile?.displayName).toBe(world.organization.name);
  });

  it('seeds two employees under a real department and position', async () => {
    const world = await createSeededWorld();
    expect(world.employees).toHaveLength(2);
    for (const employee of world.employees) {
      expect(employee.organizationId).toBe(world.organizationId);
    }
  });

  it('seeds two CRM customers', async () => {
    const world = await createSeededWorld();
    expect(world.customers).toHaveLength(2);
    const { customers, total } = await world.runtimes.crm.queries.findCustomers({
      organizationId: world.organizationId,
    });
    expect(total).toBe(2);
    expect(customers.map((c) => c.id).sort()).toEqual(world.customers.map((c) => c.id).sort());
  });

  it('seeds two catalog products', async () => {
    const world = await createSeededWorld();
    expect(world.products).toHaveLength(2);
    const { products, total } = await world.runtimes.businessDna.queries.findProducts({
      organizationId: world.organizationId,
    });
    expect(total).toBe(2);
    expect(products.every((product) => product.currency === 'USD')).toBe(true);
  });

  it('seeds one warehouse', async () => {
    const world = await createSeededWorld();
    expect(world.warehouse.code).toBe('WH-MAIN');
    const found = await world.runtimes.inventory.warehouses.getWarehouse(
      world.organizationId,
      world.warehouse.id,
    );
    expect(found?.id).toBe(world.warehouse.id);
  });

  it('seeds a six-account chart of accounts covering every account type', async () => {
    const world = await createSeededWorld();
    const accounts = Object.values(world.accounts);
    expect(accounts).toHaveLength(6);
    const types = new Set(accounts.map((account) => account.accountType));
    expect(types).toEqual(new Set(['asset', 'revenue', 'expense']));
  });

  it('seeds one project linked to a real seeded customer', async () => {
    const world = await createSeededWorld();
    expect(world.project.code).toBe('PRJ-100');
    expect(world.project.customerId).toBe(world.customers[0]?.id);
  });

  it('seeds two AI workers with distinct workforce types', async () => {
    const world = await createSeededWorld();
    expect(world.aiWorkers).toHaveLength(2);
    const types = world.aiWorkers.map((worker) => worker.profile.workforceType).sort();
    expect(types).toEqual(['operations_ai', 'sales_ai']);
  });

  it('every one of the ten seeded runtimes answers a real query for the seeded organization', async () => {
    const world = await createSeededWorld();
    const { organizationId, runtimes } = world;

    await expect(runtimes.businessDna.queries.findOrganizations({})).resolves.toBeDefined();
    await expect(runtimes.crm.queries.findCustomers({ organizationId })).resolves.toBeDefined();
    await expect(
      runtimes.sales.queries.findOpportunities({ organizationId }),
    ).resolves.toBeDefined();
    await expect(runtimes.finance.queries.findAccounts({ organizationId })).resolves.toBeDefined();
    await expect(
      runtimes.inventory.queries.findWarehouses({ organizationId }),
    ).resolves.toBeDefined();
    await expect(runtimes.hr.queries.findEmployees({ organizationId })).resolves.toBeDefined();
    await expect(runtimes.projects.queries.findProjects({ organizationId })).resolves.toBeDefined();
    await expect(
      runtimes.customerSuccess.queries.findCustomers({ organizationId }),
    ).resolves.toBeDefined();
    await expect(runtimes.analytics.queries.findKPIs({ organizationId })).resolves.toBeDefined();
    await expect(
      runtimes.aiWorkforce.registry.findByOrganization(organizationId),
    ).resolves.toHaveLength(2);
  });
});
