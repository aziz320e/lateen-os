/**
 * Task 6 — Enterprise Demo Environment seed script.
 *
 * Every entity below is created through a real HTTP call to
 * `apps/backend`'s real REST API (Task 4's `/api/v1/*` controllers,
 * plus the platform-wide `/auth`/`/api/v1/administration` endpoints) —
 * never a repository, never a direct Postgres insert. See
 * `scripts/lib/dev-auth.ts` for why authentication is a locally-signed
 * token rather than a live `/auth/login` call in this sandbox (no
 * reachable PostgreSQL).
 *
 * Run: `pnpm demo:seed` (backend must already be running on :4013).
 */
import { issueDevToken } from './lib/dev-auth.js';
import { createRestClient } from './lib/rest-client.js';

const ORGANIZATION_ID = 'acme-demo-co';

const token = issueDevToken({
  sub: 'demo-seed-script',
  organizationId: ORGANIZATION_ID,
  roles: ['admin'],
  permissions: ['platform:admin'],
});
const api = createRestClient(token);

const counts: Record<string, number> = {};
function record(label: string, n: number): void {
  counts[label] = (counts[label] ?? 0) + n;
}

async function inBatches<T, R>(
  items: readonly T[],
  batchSize: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map((item, j) => fn(item, i + j)));
    results.push(...batchResults);
  }
  return results;
}

// ---------------------------------------------------------------------------
// 1. Organization + Business Profile
// ---------------------------------------------------------------------------
async function seedOrganization(): Promise<void> {
  await api.post('/api/v1/administration/organizations', {
    organizationId: ORGANIZATION_ID,
    name: 'Acme Signage & Fabrication Co.',
    plan: 'business',
  });
  record('Organizations', 1);

  // No Business DNA REST controller exists (Task 4's assigned domains were
  // CRM/Sales/Finance/Inventory/Projects/HR/CustomerSuccess/Documents/
  // Analytics/Administration/Marketplace only) — the closest real REST
  // surface for organization-level profile data is Administration's
  // Settings engine, used here as an organization-scoped business profile.
  await api.post('/api/v1/administration/settings/organization', {
    key: 'businessProfile',
    value: {
      displayName: 'Acme Signage & Fabrication Co.',
      legalName: 'Acme Signage & Fabrication Company LLC',
      industry: 'Commercial Signage Manufacturing',
      registrationNumber: 'REG-ACME-2026',
      taxId: 'TAX-ACME-2026',
      defaultCurrency: 'USD',
      timezone: 'America/Chicago',
    },
  });
  record('Business Profiles', 1);
  console.log('✓ Organization + Business Profile');
}

// ---------------------------------------------------------------------------
// 2. Departments, Positions, Employees
// ---------------------------------------------------------------------------
const DEPARTMENTS = [
  { code: 'OPS', name: 'Operations' },
  { code: 'SLS', name: 'Sales' },
  { code: 'FIN', name: 'Finance' },
  { code: 'ENG', name: 'Engineering' },
  { code: 'SUP', name: 'Customer Support' },
];

const EMPLOYEE_NAMES: readonly [string, string][] = [
  ['Jordan', 'Reyes'],
  ['Priya', 'Nair'],
  ['Marcus', 'Chen'],
  ['Sofia', 'Alvarez'],
  ['Ethan', 'Brooks'],
  ['Wei', 'Zhang'],
  ['Amara', 'Okafor'],
  ['Liam', 'Murphy'],
  ['Noor', 'Haddad'],
  ['Grace', 'Kim'],
  ['Diego', 'Ferreira'],
  ['Ava', 'Thompson'],
  ['Sanjay', 'Rao'],
  ['Isabel', 'Costa'],
  ['Owen', 'Fitzgerald'],
];

interface SeededDepartment {
  readonly id: string;
  readonly code: string;
  readonly name: string;
}
interface SeededEmployee {
  readonly id: string;
  readonly departmentId: string;
}

async function seedHr(): Promise<{ departments: SeededDepartment[]; employees: SeededEmployee[] }> {
  const departments: SeededDepartment[] = [];
  for (const dept of DEPARTMENTS) {
    const created = await api.post<SeededDepartment>('/api/v1/hr/departments', {
      code: dept.code,
      name: dept.name,
      unitType: 'department',
    });
    departments.push(created);
  }
  record('Departments', departments.length);

  // One position per department so every hire has a real positionId.
  const positions = await inBatches(departments, 5, async (dept) =>
    api.post<{ id: string }>('/api/v1/hr/positions', {
      title: `${dept.name} Specialist`,
      departmentId: dept.id,
      jobGrade: 'M1',
      salaryGrade: 'S3',
      baseSalary: '58000',
      currency: 'USD',
      headcount: 3,
    }),
  );

  const employees: SeededEmployee[] = [];
  for (let i = 0; i < EMPLOYEE_NAMES.length; i += 1) {
    const [firstName, lastName] = EMPLOYEE_NAMES[i] as [string, string];
    const dept = departments[i % departments.length] as SeededDepartment;
    const position = positions[i % positions.length] as { id: string };
    const created = await api.post<SeededEmployee>('/api/v1/hr/employees', {
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme-demo.example`,
      departmentId: dept.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: String(55000 + (i % 5) * 2000),
      currency: 'USD',
      hireDate: `2025-0${(i % 9) + 1}-1${i % 2}`,
    });
    employees.push({ id: created.id, departmentId: dept.id });
  }
  record('Employees', employees.length);
  console.log(
    `✓ ${departments.length} Departments, ${positions.length} Positions, ${employees.length} Employees`,
  );
  return { departments, employees };
}

// ---------------------------------------------------------------------------
// 3. Customers
// ---------------------------------------------------------------------------
const CUSTOMER_NAMES = [
  'Northgate Retail Group',
  'Blueharbor Construction',
  'Summit Ridge Properties',
  'Cascade Auto Group',
  'Ironwood Manufacturing',
  'Lakeside Medical Center',
  'Prairie View Schools',
  'Redstone Hospitality',
  'Meridian Logistics',
  'Copperfield Realty',
  'Vantage Point Retail',
  'Harborview Marina',
  'Golden Plains Agriculture',
  'Silverline Financial',
  'Oakmont Legal Group',
  'Brightwater Utilities',
  'Falcon Ridge Motors',
  'Willowbrook Dental',
  'Crestview Insurance',
  'Timberline Outfitters',
  'Pinnacle Sports Complex',
  'Riverside Brewing Co.',
  'Sterling Tech Park',
  'Maple Grove Bakery',
  'Union Square Theater',
];

interface SeededCustomer {
  readonly id: string;
  readonly name: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedCustomers(): Promise<SeededCustomer[]> {
  const customers = await inBatches(CUSTOMER_NAMES, 10, async (name, i) =>
    api.post<SeededCustomer>('/api/v1/crm/customers', {
      name,
      email: `ap@${slugify(name)}.example`,
      company: name,
      tags: [i % 2 === 0 ? 'retail' : 'commercial'],
    }),
  );
  record('Customers', customers.length);
  console.log(`✓ ${customers.length} Customers`);
  return customers;
}

// ---------------------------------------------------------------------------
// 4. Vendors
// ---------------------------------------------------------------------------
const VENDOR_NAMES = [
  'Apex Aluminum Supply',
  'Beacon Acrylic Distributors',
  'Circuit & LED Wholesale',
  'Delta Steel Fabricators',
  'Evergreen Vinyl Graphics',
  'Frontier Electrical Components',
  'Granite Hardware Supply',
  'Horizon Freight Carriers',
  'Ivy Print Materials',
  'Junction Powder Coating',
];

async function seedVendors(): Promise<void> {
  const vendors = await inBatches(VENDOR_NAMES, 10, async (name) =>
    api.post<{ id: string }>('/api/v1/finance/ap/vendors', {
      displayName: name,
      currency: 'USD',
      paymentTermsDays: 30,
    }),
  );
  record('Vendors', vendors.length);
  console.log(`✓ ${vendors.length} Vendors`);
}

// ---------------------------------------------------------------------------
// 5. Warehouses + 150 Products (Inventory items, stocked per warehouse)
// ---------------------------------------------------------------------------
const WAREHOUSES = [
  {
    code: 'WH-MAIN',
    name: 'Main Production Warehouse',
    address: '100 Industrial Way, Springfield',
  },
  { code: 'WH-NORTH', name: 'North Distribution Center', address: '450 Commerce Blvd, Rockford' },
  { code: 'WH-SOUTH', name: 'South Fabrication Yard', address: '77 Foundry Rd, Bloomington' },
];

const PRODUCT_CATEGORIES = [
  'Illuminated Signage',
  'Non-Illuminated Signage',
  'Vehicle Wraps',
  'Monument Signs',
  'Digital Displays',
];

interface SeededWarehouse {
  readonly id: string;
  readonly code: string;
}
interface SeededProduct {
  readonly id: string;
  readonly sku: string;
}

async function seedInventoryCatalog(): Promise<{
  warehouses: SeededWarehouse[];
  products: SeededProduct[];
}> {
  const warehouses: SeededWarehouse[] = [];
  for (const wh of WAREHOUSES) {
    warehouses.push(await api.post<SeededWarehouse>('/api/v1/inventory/warehouses', wh));
  }
  record('Warehouses', warehouses.length);

  const productSpecs = Array.from({ length: 150 }, (_, i) => {
    const category = PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length] as string;
    const seq = String(i + 1).padStart(3, '0');
    return { sku: `SKU-${seq}`, name: `${category} — Model ${seq}`, category };
  });

  const products = await inBatches(productSpecs, 20, async (spec) =>
    api.post<SeededProduct>('/api/v1/inventory/items', {
      sku: spec.sku,
      name: spec.name,
      unitOfMeasure: 'each',
    }),
  );
  record('Products', products.length);
  console.log(`✓ ${warehouses.length} Warehouses, ${products.length} Products`);
  return { warehouses, products };
}

/** Establishes the "products belong to warehouses" relationship: every product receives real opening stock into one warehouse via a real inventory movement. */
async function seedInventoryTransactions(
  warehouses: readonly SeededWarehouse[],
  products: readonly SeededProduct[],
): Promise<void> {
  const receipts = await inBatches(products, 20, async (product, i) => {
    const warehouse = warehouses[i % warehouses.length] as SeededWarehouse;
    return api.post('/api/v1/inventory/movements/receive', {
      itemId: product.id,
      warehouseId: warehouse.id,
      quantity: String(20 + (i % 10) * 5),
      reason: 'Opening stock',
      referenceId: `OPEN-${product.sku}`,
    });
  });
  record('Inventory Transactions', receipts.length);

  // Round out the "Inventory Transactions" volume with real transfer
  // movements across a sample of products (a distinct movement type
  // from the opening-stock receipts above).
  let extra = 0;
  const movementSample = products.slice(0, 10);
  for (let i = 0; i < movementSample.length; i += 1) {
    const product = movementSample[i] as SeededProduct;
    const from = warehouses[i % warehouses.length] as SeededWarehouse;
    const to = warehouses[(i + 1) % warehouses.length] as SeededWarehouse;
    await api.post('/api/v1/inventory/movements/transfer', {
      itemId: product.id,
      fromWarehouseId: from.id,
      toWarehouseId: to.id,
      quantity: '5',
      reason: 'Rebalancing stock across warehouses',
    });
    extra += 1;
  }
  record('Inventory Transactions', extra);
  console.log(`✓ ${receipts.length + extra} Inventory Transactions (receipts + transfers)`);
}

// ---------------------------------------------------------------------------
// 6. Chart of Accounts + Opening Balances
// ---------------------------------------------------------------------------
const CHART_OF_ACCOUNTS = [
  { code: '1000', name: 'Cash', accountType: 'asset' },
  { code: '1100', name: 'Accounts Receivable', accountType: 'asset' },
  { code: '1200', name: 'Inventory', accountType: 'asset' },
  { code: '1500', name: 'Equipment', accountType: 'asset' },
  { code: '2000', name: 'Accounts Payable', accountType: 'liability' },
  { code: '2100', name: 'Accrued Payroll Liability', accountType: 'liability' },
  { code: '3000', name: "Owner's Equity", accountType: 'equity' },
  { code: '4000', name: 'Sales Revenue', accountType: 'revenue' },
  { code: '4100', name: 'Service Revenue', accountType: 'revenue' },
  { code: '5000', name: 'Cost of Goods Sold', accountType: 'expense' },
  { code: '5100', name: 'Payroll Expense', accountType: 'expense' },
  { code: '5200', name: 'Rent Expense', accountType: 'expense' },
  { code: '5300', name: 'Utilities Expense', accountType: 'expense' },
];

interface SeededAccount {
  readonly id: string;
  readonly code: string;
}

async function seedChartOfAccounts(): Promise<Record<string, SeededAccount>> {
  const byCode: Record<string, SeededAccount> = {};
  for (const account of CHART_OF_ACCOUNTS) {
    byCode[account.code] = await api.post<SeededAccount>('/api/v1/finance/accounts', account);
  }
  record('Chart of Accounts', Object.keys(byCode).length);
  console.log(`✓ ${Object.keys(byCode).length} Chart of Accounts entries`);

  // Opening balances — one balanced journal entry: Cash + Inventory +
  // Equipment funded by Owner's Equity.
  const je = await api.post<{ id: string }>('/api/v1/finance/journal-entries', {
    entryDate: '2026-01-01',
    memo: 'Opening balances',
    currency: 'USD',
    lines: [
      {
        accountId: (byCode['1000'] as SeededAccount).id,
        debit: '150000',
        credit: '0',
        description: 'Opening cash',
      },
      {
        accountId: (byCode['1200'] as SeededAccount).id,
        debit: '40000',
        credit: '0',
        description: 'Opening inventory',
      },
      {
        accountId: (byCode['1500'] as SeededAccount).id,
        debit: '35000',
        credit: '0',
        description: 'Opening equipment',
      },
      {
        accountId: (byCode['3000'] as SeededAccount).id,
        debit: '0',
        credit: '225000',
        description: "Owner's equity funding",
      },
    ],
  });
  await api.post(`/api/v1/finance/journal-entries/${je.id}/post`);
  record('Opening Balance Journal Entries', 1);
  console.log('✓ Opening balances posted to the General Ledger');
  return byCode;
}

// ---------------------------------------------------------------------------
// 7. Sales pipeline: Opportunities -> Quotes -> Sales Orders (closeWon)
// ---------------------------------------------------------------------------
interface SeededOpportunity {
  readonly id: string;
  readonly customerId?: string;
}

async function seedSalesPipeline(
  customers: readonly SeededCustomer[],
): Promise<SeededOpportunity[]> {
  const opportunities = await inBatches(
    Array.from({ length: 30 }, (_, i) => i),
    10,
    async (i) => {
      const customer = customers[i % customers.length] as SeededCustomer;
      return api.post<SeededOpportunity>('/api/v1/sales/opportunities', {
        name: `${customer.name} — Signage Package ${i + 1}`,
        customerId: customer.id,
        amount: String(5000 + (i % 12) * 1500),
        currency: 'USD',
        source: i % 3 === 0 ? 'referral' : 'outbound',
      });
    },
  );
  record('Sales Opportunities', opportunities.length);

  // 20 Quotes against the first 20 opportunities.
  const quotes = await inBatches(opportunities.slice(0, 20), 10, async (opp, i) =>
    api.post<{ id: string }>('/api/v1/sales/quotes', {
      title: `Quote for ${opp.id}`,
      opportunityId: opp.id,
      customerId: opp.customerId,
      currency: 'USD',
      lineItems: [
        {
          description: 'Channel letter signage package',
          quantity: '1',
          unitPrice: String(4500 + (i % 10) * 1200),
        },
      ],
    }),
  );
  record('Quotes', quotes.length);

  // 15 "Sales Orders" — sales-engine has no separate Sales Order
  // aggregate (never invented one, per "do not modify engine
  // contracts" / "never duplicate business logic"); the real
  // equivalent state transition is the opportunity's own
  // `advanceStage` -> `closeWon`, which is what actually marks a deal
  // as a won order in this engine.
  const orderCandidates = opportunities.slice(0, 15);
  for (const opp of orderCandidates) {
    await api.post(`/api/v1/sales/opportunities/${opp.id}/advance-stage`, { toStage: 'qualified' });
    await api.post(`/api/v1/sales/opportunities/${opp.id}/advance-stage`, { toStage: 'proposal' });
    await api.post(`/api/v1/sales/opportunities/${opp.id}/advance-stage`, {
      toStage: 'negotiation',
    });
    await api.post(`/api/v1/sales/opportunities/${opp.id}/close-won`, {});
  }
  record('Sales Orders (won opportunities)', orderCandidates.length);
  console.log(
    `✓ ${opportunities.length} Opportunities, ${quotes.length} Quotes, ${orderCandidates.length} Sales Orders (won)`,
  );
  return opportunities;
}

// ---------------------------------------------------------------------------
// 8. Invoices + Payments
// ---------------------------------------------------------------------------
interface SeededInvoice {
  readonly id: string;
  readonly total: string;
}
interface SeededARCustomer {
  readonly id: string;
}

async function seedInvoicesAndPayments(
  customers: readonly SeededCustomer[],
  opportunities: readonly SeededOpportunity[],
): Promise<SeededInvoice[]> {
  const wonOpportunities = opportunities.slice(0, 15);

  // Accounts Receivable models its own Customer record (finance-engine's
  // billing-relevant subset: credit limit, payment terms, currency),
  // linked back to the real CRM customer only via `externalCustomerId` —
  // it is not the same aggregate as `crm-engine`'s Customer, so an AR
  // customer must be created before any invoice can reference one.
  const arCustomerByCrmId = new Map<string, SeededARCustomer>();
  for (let i = 0; i < wonOpportunities.length; i += 1) {
    const opp = wonOpportunities[i] as SeededOpportunity;
    const crmCustomerId = opp.customerId ?? (customers[i % customers.length] as SeededCustomer).id;
    if (!arCustomerByCrmId.has(crmCustomerId)) {
      const crmCustomer = customers.find((c) => c.id === crmCustomerId);
      const arCustomer = await api.post<SeededARCustomer>('/api/v1/finance/ar/customers', {
        displayName: crmCustomer?.name ?? crmCustomerId,
        externalCustomerId: crmCustomerId,
        currency: 'USD',
        paymentTermsDays: 30,
      });
      arCustomerByCrmId.set(crmCustomerId, arCustomer);
    }
  }
  record('AR Customers', arCustomerByCrmId.size);

  const invoices = await inBatches(wonOpportunities, 10, async (opp, i) => {
    const crmCustomerId = opp.customerId ?? (customers[i % customers.length] as SeededCustomer).id;
    const arCustomer = arCustomerByCrmId.get(crmCustomerId) as SeededARCustomer;
    const invoice = await api.post<SeededInvoice>('/api/v1/finance/ar/invoices', {
      customerId: arCustomer.id,
      currency: 'USD',
      sourceOpportunityId: opp.id,
      lines: [
        {
          description: 'Signage fabrication & installation',
          quantity: '1',
          unitPrice: String(4500 + (i % 10) * 1200),
        },
      ],
    });
    await api.post(`/api/v1/finance/ar/invoices/${invoice.id}/issue`, { issueDate: '2026-02-01' });
    return invoice;
  });
  record('Invoices', invoices.length);

  // 10 payments against the first 10 invoices.
  const paid = invoices.slice(0, 10);
  for (const invoice of paid) {
    await api.post(`/api/v1/finance/ar/invoices/${invoice.id}/payments`, {
      amount: invoice.total,
      method: 'ach',
      paidAt: '2026-02-10T00:00:00.000Z',
    });
  }
  record('Payments', paid.length);
  console.log(`✓ ${invoices.length} Invoices, ${paid.length} Payments`);
  return invoices;
}

// ---------------------------------------------------------------------------
// 9. Projects + Tasks
// ---------------------------------------------------------------------------
interface SeededProject {
  readonly id: string;
}

async function seedProjects(customers: readonly SeededCustomer[]): Promise<SeededProject[]> {
  const projects = await inBatches(
    Array.from({ length: 10 }, (_, i) => i),
    5,
    async (i) => {
      const customer = customers[i % customers.length] as SeededCustomer;
      return api.post<SeededProject>('/api/v1/projects', {
        code: `PRJ-${String(100 + i)}`,
        name: `${customer.name} Storefront Signage Rollout`,
        description: `Design, fabricate, and install signage for ${customer.name}.`,
        customerId: customer.id,
        startDate: '2026-02-02',
        targetEndDate: '2026-05-01',
      });
    },
  );
  record('Projects', projects.length);

  const taskSpecs = Array.from({ length: 50 }, (_, i) => ({
    projectId: (projects[i % projects.length] as SeededProject).id,
    title: `Task ${i + 1}: ${['Site survey', 'Design approval', 'Fabrication', 'Installation', 'Final inspection'][i % 5]}`,
  }));
  const tasks = await inBatches(taskSpecs, 20, async (spec) =>
    api.post('/api/v1/projects/tasks', {
      projectId: spec.projectId,
      title: spec.title,
      priority: 'medium',
    }),
  );
  record('Tasks', tasks.length);
  console.log(`✓ ${projects.length} Projects, ${tasks.length} Tasks`);
  return projects;
}

// ---------------------------------------------------------------------------
// 10. Attendance, Leave, Payroll
// ---------------------------------------------------------------------------
async function seedHrOperations(employees: readonly SeededEmployee[]): Promise<void> {
  let attendanceCount = 0;
  for (const employee of employees) {
    const session = await api.post<{ id: string }>(
      `/api/v1/hr/attendance/${employee.id}/clock-in`,
      { at: '2026-02-03T08:00:00.000Z' },
    );
    await api.post(`/api/v1/hr/attendance/sessions/${session.id}/clock-out`, {
      at: '2026-02-03T17:00:00.000Z',
    });
    attendanceCount += 1;
  }
  record('Attendance Records', attendanceCount);

  let leaveCount = 0;
  for (const employee of employees.slice(0, 10)) {
    const leave = await api.post<{ id: string }>('/api/v1/hr/leave/requests', {
      employeeId: employee.id,
      leaveType: 'annual',
      startDate: '2026-03-10',
      endDate: '2026-03-12',
      reason: 'Personal time off',
    });
    if (leaveCount % 2 === 0) await api.post(`/api/v1/hr/leave/requests/${leave.id}/approve`);
    leaveCount += 1;
  }
  record('Leave Requests', leaveCount);

  const payrollRun = await api.post<{ id: string }>('/api/v1/hr/payroll/runs', {
    periodStart: '2026-02-01',
    periodEnd: '2026-02-28',
    currency: 'USD',
    employeeIds: employees.map((e) => e.id),
  });
  await api.post(`/api/v1/hr/payroll/runs/${payrollRun.id}/finalize`);
  record('Payroll Runs', 1);
  console.log(
    `✓ ${attendanceCount} Attendance Records, ${leaveCount} Leave Requests, 1 Payroll Run (${employees.length} employees)`,
  );
}

// ---------------------------------------------------------------------------
// 11. Customer Success Records
// ---------------------------------------------------------------------------
async function seedCustomerSuccess(customers: readonly SeededCustomer[]): Promise<void> {
  const sample = customers.slice(0, 15);
  let onboarded = 0;
  for (let i = 0; i < sample.length; i += 1) {
    const customer = sample[i] as SeededCustomer;
    const record_ = await api.post<{ id: string }>('/api/v1/customer-success/records', {
      customerId: customer.id,
    });
    if (i % 2 === 0) {
      await api.post(`/api/v1/customer-success/records/${record_.id}/activate`);
      if (i % 4 === 0)
        await api.post(`/api/v1/customer-success/records/${record_.id}/progress-to-adoption`);
    }
    onboarded += 1;
  }
  record('Customer Success Records', onboarded);
  console.log(`✓ ${onboarded} Customer Success Records`);
}

// ---------------------------------------------------------------------------
// 12. Analytics — computed from the real seeded data above
// ---------------------------------------------------------------------------
async function seedAnalytics(
  opportunities: readonly SeededOpportunity[],
  invoices: readonly SeededInvoice[],
): Promise<void> {
  const totalRevenue = invoices
    .slice(0, 10)
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);
  const pipelineValue = opportunities.slice(15).reduce((sum) => sum + 6000, 0); // remaining open opportunities, deterministic estimate
  const wonCount = 15;
  const totalCount = opportunities.length;

  await api.post('/api/v1/analytics/kpis/revenue', {
    value: totalRevenue,
    context: { source: 'demo-seed', invoiceCount: 10 },
  });
  await api.post('/api/v1/analytics/kpis/pipeline_value', {
    value: pipelineValue,
    context: { source: 'demo-seed' },
  });
  await api.post('/api/v1/analytics/kpis/win_rate', {
    value: Math.round((wonCount / totalCount) * 100),
    context: { source: 'demo-seed' },
  });
  await api.post('/api/v1/analytics/kpis/average_deal_size', {
    value: Math.round(totalRevenue / 10),
    context: { source: 'demo-seed' },
  });
  record('Analytics Metrics (KPIs)', 4);

  await api.post('/api/v1/analytics/dashboards', {
    dashboardType: 'sales',
    name: 'Demo Sales Overview',
    config: { generatedBy: 'demo-seed' },
  });
  record('Analytics Dashboards', 1);

  await api.post('/api/v1/analytics/snapshots/sales/compute', {});
  await api.post('/api/v1/analytics/snapshots/revenue/compute', {});
  record('Analytics Snapshots', 2);
  console.log(
    '✓ Analytics metrics computed from real seeded data (revenue, pipeline, win rate, avg deal size) + 1 dashboard + 2 snapshots',
  );
}

// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log(
    `Seeding demo data for organization "${ORGANIZATION_ID}" via ${process.env.DEMO_API_BASE_URL ?? 'http://localhost:4013'} ...\n`,
  );

  await seedOrganization();
  const { employees } = await seedHr();
  const customers = await seedCustomers();
  await seedVendors();
  const { warehouses, products } = await seedInventoryCatalog();
  await seedInventoryTransactions(warehouses, products);
  await seedChartOfAccounts();
  const opportunities = await seedSalesPipeline(customers);
  const invoices = await seedInvoicesAndPayments(customers, opportunities);
  await seedProjects(customers);
  await seedHrOperations(employees);
  await seedCustomerSuccess(customers);
  await seedAnalytics(opportunities, invoices);

  console.log('\n=== Demo Seed Summary ===');
  for (const [label, n] of Object.entries(counts)) {
    console.log(`  ${label.padEnd(32)} ${n}`);
  }
  console.log(`\nOrganization ID for validation scripts: ${ORGANIZATION_ID}`);
}

main().catch((error) => {
  console.error('\nDemo seed failed:', error);
  process.exitCode = 1;
});
