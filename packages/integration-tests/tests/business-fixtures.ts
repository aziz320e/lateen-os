/**
 * Deterministic seed data for the business-scenario integration suite.
 * Every entity below is created through its owning engine's real,
 * public runtime API (`createXRuntime()` + the engine's own lifecycle
 * methods) — never a repository, never a hand-built entity object.
 * "Deterministic" here means fixed, hand-picked field content (names,
 * codes, amounts) rather than random/fake data — ids and timestamps are
 * still real (`crypto`-backed ids, real `now()`), exactly as the
 * platform's own determinism rules define (see `docs/adr/0007`).
 *
 * `createSeededWorld()` composes every runtime this suite's scenarios
 * need — including the real cross-engine dependency injection the
 * platform's architecture requires (e.g. HR's `finance.tax` slice) —
 * and creates one baseline organization with a business profile,
 * employees, customers, products, a warehouse, a chart of accounts, a
 * project, and AI workers. Scenario tests build their own
 * scenario-specific entities on top of this shared world.
 */
import { createWorkforceRuntime, type AIWorker } from '@lateen-os/ai-workforce';
import { createAnalyticsRuntime } from '@lateen-os/analytics-engine';
import { createBusinessDnaRuntime, type Organization, type Product } from '@lateen-os/business-dna';
import { createCrmRuntime, type Customer } from '@lateen-os/crm-engine';
import { createCustomerSuccessRuntime } from '@lateen-os/customer-success-engine';
import { createFinanceRuntime, type Account } from '@lateen-os/finance-engine';
import { createHrRuntime, type Employee } from '@lateen-os/hr-engine';
import { createInventoryRuntime, type Warehouse } from '@lateen-os/inventory-engine';
import { createProjectRuntime, type Project } from '@lateen-os/project-management-engine';
import { createSalesRuntime } from '@lateen-os/sales-engine';

export interface SeededWorld {
  readonly organizationId: string;
  readonly organization: Organization;
  readonly employees: readonly Employee[];
  readonly customers: readonly Customer[];
  readonly products: readonly Product[];
  readonly warehouse: Warehouse;
  readonly accounts: {
    readonly cash: Account;
    readonly accountsReceivable: Account;
    readonly inventory: Account;
    readonly revenue: Account;
    readonly costOfGoodsSold: Account;
    readonly payrollExpense: Account;
  };
  readonly project: Project;
  readonly aiWorkers: readonly AIWorker[];
  readonly runtimes: {
    readonly businessDna: ReturnType<typeof createBusinessDnaRuntime>;
    readonly crm: ReturnType<typeof createCrmRuntime>;
    readonly sales: ReturnType<typeof createSalesRuntime>;
    readonly finance: ReturnType<typeof createFinanceRuntime>;
    readonly inventory: ReturnType<typeof createInventoryRuntime>;
    readonly hr: ReturnType<typeof createHrRuntime>;
    readonly projects: ReturnType<typeof createProjectRuntime>;
    readonly customerSuccess: ReturnType<typeof createCustomerSuccessRuntime>;
    readonly analytics: ReturnType<typeof createAnalyticsRuntime>;
    readonly aiWorkforce: ReturnType<typeof createWorkforceRuntime>;
  };
}

/** Creates every runtime this suite needs, wired with the real cross-engine dependencies the platform's architecture defines. */
export async function createSeededWorld(): Promise<SeededWorld> {
  const businessDna = createBusinessDnaRuntime();
  const crm = createCrmRuntime();
  const sales = createSalesRuntime();
  const finance = createFinanceRuntime();
  const inventory = createInventoryRuntime();
  // HR's real Relationship Layer calls Finance Engine's own tax API — see
  // packages/hr-engine/src/relationship-management — never a repository.
  const hr = createHrRuntime({ finance: { tax: finance.tax } });
  const projects = createProjectRuntime();
  const customerSuccess = createCustomerSuccessRuntime();
  const analytics = createAnalyticsRuntime();
  const aiWorkforce = createWorkforceRuntime();

  const organization = await businessDna.organization.create({
    code: 'ACME-SIGN',
    name: 'Acme Signage Co.',
    legalName: 'Acme Signage Company LLC',
    registrationNumber: 'REG-100200',
    taxId: 'TAX-100200',
    defaultCurrency: 'USD',
    defaultLocale: 'en-US',
    timezone: 'UTC',
  });
  const organizationId = organization.id;

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

  // --- Employees (department -> position -> hire) ---
  const department = await hr.organizationStructure.create(organizationId, {
    code: 'OPS',
    name: 'Operations',
    unitType: 'department',
  });
  const position = await hr.positions.create(organizationId, {
    title: 'Production Manager',
    departmentId: department.id,
    jobGrade: 'M1',
    salaryGrade: 'S3',
    baseSalary: '60000',
    currency: 'USD',
    headcount: 2,
  });
  const employees = [
    await hr.employees.hire(organizationId, {
      firstName: 'Jordan',
      lastName: 'Reyes',
      email: 'jordan.reyes@acme-signage.example',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '60000',
      currency: 'USD',
      hireDate: '2025-01-06',
    }),
    await hr.employees.hire(organizationId, {
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair@acme-signage.example',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '58000',
      currency: 'USD',
      hireDate: '2025-03-17',
    }),
  ];

  // --- Customers (CRM) ---
  const customers = [
    await crm.customers.create(organizationId, {
      name: 'Northgate Retail Group',
      email: 'ap@northgate-retail.example',
      company: 'Northgate Retail Group',
      tags: ['retail'],
    }),
    await crm.customers.create(organizationId, {
      name: 'Blueharbor Construction',
      email: 'accounts@blueharbor.example',
      company: 'Blueharbor Construction',
      tags: ['construction'],
    }),
  ];

  // --- Products (Business DNA catalog) ---
  const products = [
    await businessDna.products.createProduct(organizationId, {
      code: 'SIGN-CHANNEL-LTR',
      name: 'Illuminated Channel Letters',
      category: 'illuminated',
      productionType: 'fabrication',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '850.00',
      costPrice: '410.00',
    }),
    await businessDna.products.createProduct(organizationId, {
      code: 'SIGN-VEHICLE-WRAP',
      name: 'Full Vehicle Wrap',
      category: 'vehicle_graphics',
      productionType: 'print_and_fabrication',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '2200.00',
      costPrice: '960.00',
    }),
  ];

  // --- Warehouse (Inventory) ---
  const warehouse = await inventory.warehouses.createWarehouse(organizationId, {
    code: 'WH-MAIN',
    name: 'Main Production Warehouse',
    address: '100 Industrial Way, Springfield',
  });

  // --- Chart of Accounts (Finance) ---
  const accounts = {
    cash: await finance.chartOfAccounts.create(organizationId, {
      code: '1000',
      name: 'Cash',
      accountType: 'asset',
    }),
    accountsReceivable: await finance.chartOfAccounts.create(organizationId, {
      code: '1100',
      name: 'Accounts Receivable',
      accountType: 'asset',
    }),
    inventory: await finance.chartOfAccounts.create(organizationId, {
      code: '1200',
      name: 'Inventory',
      accountType: 'asset',
    }),
    revenue: await finance.chartOfAccounts.create(organizationId, {
      code: '4000',
      name: 'Sales Revenue',
      accountType: 'revenue',
    }),
    costOfGoodsSold: await finance.chartOfAccounts.create(organizationId, {
      code: '5000',
      name: 'Cost of Goods Sold',
      accountType: 'expense',
    }),
    payrollExpense: await finance.chartOfAccounts.create(organizationId, {
      code: '5100',
      name: 'Payroll Expense',
      accountType: 'expense',
    }),
  };

  // --- Project ---
  const project = await projects.projects.create(organizationId, {
    code: 'PRJ-100',
    name: 'Northgate Storefront Signage Rollout',
    description:
      'Design, fabricate, and install channel-letter signage across 6 Northgate storefronts.',
    customerId: customers[0]?.id,
    startDate: '2026-02-02',
    targetEndDate: '2026-03-27',
  });

  // --- AI Workers ---
  const aiWorkers = [
    await aiWorkforce.lifecycle.hire({
      organizationId,
      businessDnaAgentId: 'bdna-agent-ops-1',
      runtimeAgentId: 'runtime-agent-ops-1',
      profile: {
        displayName: 'Ops Copilot',
        title: 'Operations AI',
        workforceType: 'operations_ai',
        proactiveEnabled: true,
        reactiveEnabled: true,
      },
    }),
    await aiWorkforce.lifecycle.hire({
      organizationId,
      businessDnaAgentId: 'bdna-agent-sales-1',
      runtimeAgentId: 'runtime-agent-sales-1',
      profile: {
        displayName: 'Sales Copilot',
        title: 'Sales AI',
        workforceType: 'sales_ai',
        proactiveEnabled: true,
        reactiveEnabled: true,
      },
    }),
  ];

  return {
    organizationId,
    organization,
    employees,
    customers,
    products,
    warehouse,
    accounts,
    project,
    aiWorkers,
    runtimes: {
      businessDna,
      crm,
      sales,
      finance,
      inventory,
      hr,
      projects,
      customerSuccess,
      analytics,
      aiWorkforce,
    },
  };
}
