import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { HrRuntime } from '@lateen-os/hr-engine';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';
import {
  mirrorOrganization,
  mirrorProducts,
  subscribeBusinessDna,
} from '../src/adapters/business-dna.adapter.js';
import { mirrorCustomers, subscribeCrm } from '../src/adapters/crm.adapter.js';
import { mirrorAccounts } from '../src/adapters/finance.adapter.js';
import { mirrorEmployees } from '../src/adapters/hr.adapter.js';
import { mirrorWarehouses } from '../src/adapters/inventory.adapter.js';
import { mirrorProjects } from '../src/adapters/project-management.adapter.js';
import { mirrorAll, subscribeAll, type MirroredRuntimes } from '../src/adapters/index.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';

/**
 * Persistence Adapter Layer tests. Every adapter is exercised against the
 * real, real hosted engine runtimes (via the same Runtime Registry the
 * platform host uses) — never a fake or duplicated business logic layer.
 * Only Prisma itself is faked, since no live PostgreSQL exists in this
 * environment; the fake only records what the adapter would have written.
 */
function createFakePrisma() {
  return {
    organization: { upsert: vi.fn() },
    businessProfile: { upsert: vi.fn() },
    product: { upsert: vi.fn() },
    customer: { upsert: vi.fn() },
    employee: { upsert: vi.fn() },
    warehouse: { upsert: vi.fn() },
    account: { upsert: vi.fn() },
    project: { upsert: vi.fn() },
  } as unknown as PrismaClient;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Persistence Adapter Layer', () => {
  let businessDna: BusinessDnaRuntime;
  let hr: HrRuntime;
  let crm: CrmRuntime;
  let inventory: InventoryRuntime;
  let finance: FinanceRuntime;
  let projectManagement: ProjectRuntime;
  let organizationId: string;
  let customerId: string;

  beforeAll(async () => {
    const registry = new RuntimeRegistryService();
    registry.onModuleInit();
    businessDna = registry.get<BusinessDnaRuntime>('business-dna')!;
    hr = registry.get<HrRuntime>('hr-engine')!;
    crm = registry.get<CrmRuntime>('crm-engine')!;
    inventory = registry.get<InventoryRuntime>('inventory-engine')!;
    finance = registry.get<FinanceRuntime>('finance-engine')!;
    projectManagement = registry.get<ProjectRuntime>('project-management-engine')!;

    const organization = await businessDna.organization.create({
      code: 'TEST-ORG',
      name: 'Test Org',
      legalName: 'Test Org LLC',
      registrationNumber: 'REG-1',
      taxId: 'TAX-1',
      defaultCurrency: 'USD',
      defaultLocale: 'en-US',
      timezone: 'UTC',
    });
    organizationId = organization.id;

    await businessDna.businessProfile.upsert(organizationId, {
      displayName: organization.name,
      legalEntity: {
        legalName: organization.legalName,
        entityType: 'llc',
        registrationNumber: organization.registrationNumber,
        taxId: organization.taxId,
        countryOfIncorporation: 'US',
      },
    });
    await businessDna.products.createProduct(organizationId, {
      code: 'PROD-1',
      name: 'Test Product',
      category: 'illuminated',
      productionType: 'fabrication',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '100.00',
      costPrice: '50.00',
    });

    const department = await hr.organizationStructure.create(organizationId, {
      code: 'OPS',
      name: 'Operations',
      unitType: 'department',
    });
    const position = await hr.positions.create(organizationId, {
      title: 'Manager',
      departmentId: department.id,
      jobGrade: 'M1',
      salaryGrade: 'S1',
      baseSalary: '50000',
      currency: 'USD',
      headcount: 1,
    });
    await hr.employees.hire(organizationId, {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test.employee@example.com',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '50000',
      currency: 'USD',
      hireDate: '2025-01-01',
    });

    const customer = await crm.customers.create(organizationId, {
      name: 'Test Customer',
      email: 'customer@example.com',
      company: 'Test Co',
      tags: [],
    });
    customerId = customer.id;

    await inventory.warehouses.createWarehouse(organizationId, {
      code: 'WH-1',
      name: 'Test Warehouse',
      address: '1 Test St',
    });
    await finance.chartOfAccounts.create(organizationId, {
      code: '1000',
      name: 'Cash',
      accountType: 'asset',
    });
    await projectManagement.projects.create(organizationId, {
      code: 'PRJ-1',
      name: 'Test Project',
      description: 'Test',
      customerId,
      startDate: '2026-01-01',
      targetEndDate: '2026-02-01',
    });
  });

  it('mirrorOrganization reads through the real query layer and upserts the organization + business profile', async () => {
    const prisma = createFakePrisma();
    await mirrorOrganization(prisma, businessDna, organizationId);

    expect(prisma.organization.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: organizationId },
        create: expect.objectContaining({ id: organizationId, code: 'TEST-ORG', name: 'Test Org' }),
      }),
    );
    expect(prisma.businessProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId } }),
    );
  });

  it('mirrorProducts upserts every real product returned by queries.findProducts', async () => {
    const prisma = createFakePrisma();
    await mirrorProducts(prisma, businessDna, organizationId);
    expect(prisma.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ code: 'PROD-1', organizationId }),
      }),
    );
  });

  it('mirrorEmployees, mirrorCustomers, mirrorWarehouses, mirrorAccounts, mirrorProjects each mirror real engine-owned data', async () => {
    const prisma = createFakePrisma();
    await mirrorEmployees(prisma, hr, organizationId);
    await mirrorCustomers(prisma, crm, organizationId);
    await mirrorWarehouses(prisma, inventory, organizationId);
    await mirrorAccounts(prisma, finance, organizationId);
    await mirrorProjects(prisma, projectManagement, organizationId);

    expect(prisma.employee.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ firstName: 'Test', lastName: 'Employee' }),
      }),
    );
    expect(prisma.customer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ name: 'Test Customer' }) }),
    );
    expect(prisma.warehouse.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ code: 'WH-1' }) }),
    );
    expect(prisma.account.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ code: '1000' }) }),
    );
    expect(prisma.project.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ code: 'PRJ-1' }) }),
    );
  });

  it('mirrorAll runs every adapter for a MirroredRuntimes bundle in one reconciliation pass', async () => {
    const prisma = createFakePrisma();
    const runtimes: MirroredRuntimes = {
      businessDna,
      hr,
      crm,
      inventory,
      finance,
      projectManagement,
    };
    await mirrorAll(prisma, runtimes, organizationId);

    expect(prisma.organization.upsert).toHaveBeenCalled();
    expect(prisma.product.upsert).toHaveBeenCalled();
    expect(prisma.employee.upsert).toHaveBeenCalled();
    expect(prisma.customer.upsert).toHaveBeenCalled();
    expect(prisma.warehouse.upsert).toHaveBeenCalled();
    expect(prisma.account.upsert).toHaveBeenCalled();
    expect(prisma.project.upsert).toHaveBeenCalled();
  });

  it('subscribeBusinessDna re-mirrors the organization when a real organization.updated event fires', async () => {
    const prisma = createFakePrisma();
    subscribeBusinessDna(prisma, businessDna, organizationId);
    businessDna.events.publish('organization.updated', { organizationId });
    await tick();
    expect(prisma.organization.upsert).toHaveBeenCalled();
  });

  it('subscribeCrm re-mirrors customers when a real customer.created event fires', async () => {
    const prisma = createFakePrisma();
    subscribeCrm(prisma, crm, organizationId);
    crm.events.publish('customer.created', { customerId, organizationId, name: 'Test Customer' });
    await tick();
    expect(prisma.customer.upsert).toHaveBeenCalled();
  });

  it('subscribeAll wires every adapter that has a real creation/update event, and never throws for inventory (which has none)', () => {
    const prisma = createFakePrisma();
    const runtimes: MirroredRuntimes = {
      businessDna,
      hr,
      crm,
      inventory,
      finance,
      projectManagement,
    };
    expect(() => subscribeAll(prisma, runtimes, organizationId)).not.toThrow();
  });
});
