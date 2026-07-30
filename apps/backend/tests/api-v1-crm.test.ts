import { ServiceUnavailableException } from '@nestjs/common';
import { beforeAll, describe, expect, it } from 'vitest';
import { CrmController } from '../src/api/v1/crm/crm.controller.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';
import type { AccessTokenPayload } from '../src/auth/token.service.js';

/**
 * Task 4 REST API — CRM controller, exercised directly against the real
 * hosted `crm-engine` runtime (via the same Runtime Registry the
 * platform host uses), exactly like the existing platform-endpoints
 * tests. No repository is touched anywhere in this path.
 */
describe('Task 4 — CRM REST API (/api/v1/crm)', () => {
  let controller: CrmController;
  let user: AccessTokenPayload;

  beforeAll(() => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();
    controller = new CrmController(registry);
    user = { sub: 'user-1', organizationId: 'org-crm-rest-test', roles: [], permissions: [] };
  });

  it('creates a customer through the real customer lifecycle and lists it back with pagination metadata', async () => {
    const created = await controller.createCustomer(user, {
      name: 'Acme Corp',
      email: 'ap@acme.example',
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('active');

    const page = await controller.listCustomers(user, {});
    expect(page.meta.total).toBeGreaterThanOrEqual(1);
    expect(page.data.some((customer) => customer.id === created.id)).toBe(true);
  });

  it('filters the customer list by status via the real query layer', async () => {
    const created = await controller.createCustomer(user, { name: 'Filter Target Inc' });
    await controller.archiveCustomer(user, created.id);

    const archivedPage = await controller.listCustomers(user, { status: 'archived' });
    expect(archivedPage.data.every((customer) => customer.status === 'archived')).toBe(true);
    expect(archivedPage.data.some((customer) => customer.id === created.id)).toBe(true);

    const activePage = await controller.listCustomers(user, { status: 'active' });
    expect(activePage.data.some((customer) => customer.id === created.id)).toBe(false);
  });

  it('supports offset/limit pagination and reports the pre-pagination total', async () => {
    for (let i = 0; i < 3; i += 1) {
      await controller.createLead(user, { name: `Lead ${i}` });
    }
    const firstPage = await controller.listLeads(user, { limit: 2, offset: 0 });
    expect(firstPage.data).toHaveLength(2);
    expect(firstPage.meta.total).toBeGreaterThanOrEqual(3);
  });

  it('runs a lead through create → qualify → convert and returns a real customer', async () => {
    const lead = await controller.createLead(user, { name: 'Convertible Lead', company: 'NewCo' });
    await controller.qualifyLead(user, lead.id);
    const result = await controller.convertLead(user, lead.id, {});
    expect(result.lead.status).toBe('converted');
    expect(result.customer.name).toBe('Convertible Lead');
  });

  it('creates and advances an opportunity through the real deal pipeline', async () => {
    const opportunity = await controller.createOpportunity(user, { name: 'Big Deal' });
    expect(opportunity.stage).toBe('new');

    const advanced = await controller.advanceOpportunityStage(user, opportunity.id, {
      toStage: 'qualified',
    });
    expect(advanced.stage).toBe('qualified');

    const deals = await controller.listDeals(user);
    expect(deals.data.qualified.some((deal) => deal.id === opportunity.id)).toBe(true);
  });

  it('rejects an invalid stage transition with a domain error the exception filter would map to a conflict', async () => {
    const opportunity = await controller.createOpportunity(user, { name: 'Skip Stage Deal' });
    await expect(
      controller.advanceOpportunityStage(user, opportunity.id, { toStage: 'won' }),
    ).rejects.toThrow();
  });

  it('throws ServiceUnavailableException when the engine runtime is not hosted', async () => {
    const emptyRegistry = new RuntimeRegistryService();
    // Deliberately not calling onModuleInit() — no runtimes are hosted.
    const brokenController = new CrmController(emptyRegistry);
    await expect(brokenController.listCustomers(user, {})).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
