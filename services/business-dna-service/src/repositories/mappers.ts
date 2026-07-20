import type {
  Agent,
  Branch,
  Customer,
  Department,
  Employee,
  Invoice,
  Kpi,
  Machine,
  Order,
  Organization,
  Permission,
  Policy,
  Product,
  Project,
  Quotation,
  Role,
  Service,
  Supplier,
  Workflow,
  Asset,
} from '@lateen-os/business-dna';
import type {
  AgentId,
  BranchId,
  CustomerId,
  DepartmentId,
  EmployeeId,
  InvoiceId,
  KpiId,
  MachineId,
  OrderId,
  OrganizationId,
  PermissionId,
  PolicyId,
  ProductId,
  ProjectId,
  QuotationId,
  RoleId,
  ServiceId,
  SupplierId,
  WorkflowId,
  AssetId,
} from '@lateen-os/business-dna';
import type {
  Agent as AgentRow,
  Asset as AssetRow,
  Branch as BranchRow,
  Customer as CustomerRow,
  Department as DepartmentRow,
  Employee as EmployeeRow,
  Invoice as InvoiceRow,
  Kpi as KpiRow,
  Machine as MachineRow,
  Order as OrderRow,
  Organization as OrganizationRow,
  Permission as PermissionRow,
  Policy as PolicyRow,
  Product as ProductRow,
  Project as ProjectRow,
  Quotation as QuotationRow,
  Role as RoleRow,
  Service as ServiceRow,
  Supplier as SupplierRow,
  Workflow as WorkflowRow,
} from '@prisma/client';
import { asJson, toIsoDate, toIsoDateTime } from './base.js';

export function mapOrganization(row: OrganizationRow): Organization {
  return {
    id: row.id as OrganizationId,
    code: row.code,
    name: row.name,
    legalName: row.legalName,
    registrationNumber: row.registrationNumber,
    taxId: row.taxId,
    status: row.status as Organization['status'],
    defaultCurrency: row.defaultCurrency,
    defaultLocale: row.defaultLocale,
    timezone: row.timezone,
    foundedAt: toIsoDate(row.foundedAt),
    operatingModel: row.operatingModel as Organization['operatingModel'],
    proactiveAiEnabled: row.proactiveAiEnabled,
    aiCouncilPolicyId: row.aiCouncilPolicyId ?? undefined,
    defaultAiSupervisorId: row.defaultAiSupervisorId ?? undefined,
    aiDecisionThreshold: row.aiDecisionThreshold as Organization['aiDecisionThreshold'],
    registeredAgentCount: row.registeredAgentCount ?? undefined,
    industryVerticals: asJson(row.industryVerticals) as Organization['industryVerticals'],
    productionModel: row.productionModel as Organization['productionModel'],
    serviceCoverage: row.serviceCoverage as Organization['serviceCoverage'],
    defaultPaymentTerms: row.defaultPaymentTerms ?? undefined,
    defaultSlaTier: row.defaultSlaTier as Organization['defaultSlaTier'],
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  };
}

function mapTenantRow<
  T extends {
    id: string;
    organizationId: string;
    code: string;
    createdAt: Date;
    updatedAt: Date;
    data?: unknown;
  },
  TEntity,
>(row: T, core: Omit<TEntity, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): TEntity {
  const data = asJson<Record<string, unknown>>(row.data);
  return {
    id: row.id,
    organizationId: row.organizationId,
    ...core,
    ...data,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as TEntity;
}

export function mapBranch(row: BranchRow): Branch {
  return {
    id: row.id as BranchId,
    organizationId: row.organizationId as OrganizationId,
    code: row.code,
    name: row.name,
    type: row.type as Branch['type'],
    status: row.status as Branch['status'],
    address: asJson(row.address),
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    currency: row.currency ?? undefined,
    timezone: row.timezone ?? undefined,
    managerId: row.managerId ?? undefined,
    openedAt: toIsoDate(row.openedAt),
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Branch;
}

export function mapDepartment(row: DepartmentRow): Department {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    branchId: row.branchId ?? undefined,
    parentDepartmentId: row.parentDepartmentId ?? undefined,
    description: row.description ?? undefined,
    status: row.status as Department['status'],
    headId: row.headId ?? undefined,
    costCenter: row.costCenter ?? undefined,
  }) as Department;
}

export function mapEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id as EmployeeId,
    organizationId: row.organizationId as OrganizationId,
    branchId: row.branchId ?? undefined,
    departmentId: row.departmentId ?? undefined,
    employeeNumber: row.employeeNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone ?? undefined,
    jobTitle: row.jobTitle ?? undefined,
    employmentType: row.employmentType as Employee['employmentType'],
    status: row.status as Employee['status'],
    managerId: row.managerId ?? undefined,
    hiredAt: toIsoDate(row.hiredAt),
    terminatedAt: toIsoDate(row.terminatedAt),
    identityId: row.identityId ?? undefined,
    roleIds: asJson(row.roleIds) as Employee['roleIds'],
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Employee;
}

export function mapRole(row: RoleRow): Role {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    type: row.type as Role['type'],
    status: row.status as Role['status'],
    parentRoleId: row.parentRoleId ?? undefined,
    departmentId: row.departmentId ?? undefined,
    permissionIds: asJson(row.permissionIds) as Role['permissionIds'],
  }) as Role;
}

export function mapPermission(row: PermissionRow): Permission {
  return {
    id: row.id as PermissionId,
    organizationId: row.organizationId as OrganizationId,
    code: row.code,
    name: row.name,
    description: row.description ?? undefined,
    resource: row.resource,
    action: row.action as Permission['action'],
    scope: row.scope as Permission['scope'],
    status: row.status as Permission['status'],
    policyId: row.policyId ?? undefined,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Permission;
}

export function mapCustomer(row: CustomerRow): Customer {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Customer['type'],
    status: row.status as Customer['status'],
    segment: row.segment as Customer['segment'],
    currency: row.currency,
  }) as Customer;
}

export function mapSupplier(row: SupplierRow): Supplier {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Supplier['type'],
    status: row.status as Supplier['status'],
  }) as Supplier;
}

export function mapProduct(row: ProductRow): Product {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    status: row.status as Product['status'],
    category: row.category as Product['category'],
    currency: row.currency,
    unitOfMeasure: row.unitOfMeasure as Product['unitOfMeasure'],
    productionType: row.productionType as Product['productionType'],
  }) as Product;
}

export function mapService(row: ServiceRow): Service {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Service['type'],
    status: row.status as Service['status'],
    pricingModel: row.pricingModel as Service['pricingModel'],
    currency: row.currency,
  }) as Service;
}

export function mapMachine(row: MachineRow): Machine {
  return mapTenantRow(row, {
    branchId: row.branchId,
    code: row.code,
    name: row.name,
    status: row.status as Machine['status'],
    ownerDepartmentId: row.ownerDepartmentId,
    category: row.category as Machine['category'],
    type: row.type as Machine['type'],
  }) as Machine;
}

export function mapProject(row: ProjectRow): Project {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    status: row.status as Project['status'],
    projectType: row.projectType as Project['projectType'],
    deliveryModel: row.deliveryModel as Project['deliveryModel'],
    ownerId: row.ownerId,
    currency: 'SAR',
  }) as Project;
}

export function mapQuotation(row: QuotationRow): Quotation {
  const data = asJson<Record<string, unknown>>(row.data);
  return {
    id: row.id as QuotationId,
    organizationId: row.organizationId as OrganizationId,
    number: row.number,
    customerId: row.customerId as CustomerId,
    status: row.status as Quotation['status'],
    currency: row.currency,
    subtotal: row.subtotal,
    discount: row.discount ?? undefined,
    tax: row.tax ?? undefined,
    total: row.total,
    lineItems: asJson(row.lineItems) as Quotation['lineItems'],
    ...data,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Quotation;
}

export function mapOrder(row: OrderRow): Order {
  const data = asJson<Record<string, unknown>>(row.data);
  return {
    id: row.id as OrderId,
    organizationId: row.organizationId as OrganizationId,
    number: row.number,
    customerId: row.customerId as CustomerId,
    status: row.status as Order['status'],
    currency: row.currency,
    subtotal: row.subtotal,
    discount: row.discount ?? undefined,
    tax: row.tax ?? undefined,
    total: row.total,
    lineItems: asJson(row.lineItems) as Order['lineItems'],
    ...data,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Order;
}

export function mapInvoice(row: InvoiceRow): Invoice {
  const data = asJson<Record<string, unknown>>(row.data);
  return {
    id: row.id as InvoiceId,
    organizationId: row.organizationId as OrganizationId,
    number: row.number,
    type: row.type as Invoice['type'],
    status: row.status as Invoice['status'],
    currency: row.currency,
    subtotal: row.subtotal,
    discount: row.discount ?? undefined,
    tax: row.tax ?? undefined,
    total: row.total,
    amountDue: row.amountDue,
    lineItems: asJson(row.lineItems) as Invoice['lineItems'],
    ...data,
    createdAt: toIsoDateTime(row.createdAt),
    updatedAt: toIsoDateTime(row.updatedAt),
  } as Invoice;
}

export function mapWorkflow(row: WorkflowRow): Workflow {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Workflow['type'],
    status: row.status as Workflow['status'],
    version: row.version,
    stages: asJson(row.stages) as Workflow['stages'],
  }) as Workflow;
}

export function mapPolicy(row: PolicyRow): Policy {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Policy['type'],
    status: row.status as Policy['status'],
  }) as Policy;
}

export function mapKpi(row: KpiRow): Kpi {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Kpi['type'],
    status: row.status as Kpi['status'],
    unit: row.unit,
    direction: row.direction as Kpi['direction'],
    frequency: row.frequency as Kpi['frequency'],
  }) as Kpi;
}

export function mapAsset(row: AssetRow): Asset {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    type: row.type as Asset['type'],
    status: row.status as Asset['status'],
  }) as Asset;
}

export function mapAgent(row: AgentRow): Agent {
  return mapTenantRow(row, {
    code: row.code,
    name: row.name,
    workforceType: row.workforceType as Agent['workforceType'],
    status: row.status as Agent['status'],
    proactiveEnabled: row.proactiveEnabled,
    reactiveEnabled: row.reactiveEnabled,
  }) as Agent;
}

export function extractDataFields(
  entity: Record<string, unknown>,
  coreKeys: readonly string[],
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entity)) {
    if (!coreKeys.includes(key) && value !== undefined) {
      data[key] = value;
    }
  }
  return data;
}
