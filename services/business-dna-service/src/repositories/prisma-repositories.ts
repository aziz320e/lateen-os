import type { PrismaClient, Prisma } from '@prisma/client';
import type {
  AgentRepository,
  AssetRepository,
  BranchRepository,
  CustomerRepository,
  DepartmentRepository,
  EmployeeRepository,
  InvoiceRepository,
  KpiRepository,
  MachineRepository,
  OrderRepository,
  OrganizationRepository,
  PermissionRepository,
  PolicyRepository,
  ProductRepository,
  ProjectRepository,
  QuotationRepository,
  RoleRepository,
  ServiceRepository,
  SupplierRepository,
  WorkflowRepository,
} from '@lateen-os/business-dna';
import type {
  Agent,
  Asset,
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
} from '@lateen-os/business-dna';
import type { OrganizationId } from '@lateen-os/business-dna';
import { parseDate } from './base.js';
import {
  extractDataFields,
  mapAgent,
  mapAsset,
  mapBranch,
  mapCustomer,
  mapDepartment,
  mapEmployee,
  mapInvoice,
  mapKpi,
  mapMachine,
  mapOrder,
  mapOrganization,
  mapPermission,
  mapPolicy,
  mapProduct,
  mapProject,
  mapQuotation,
  mapRole,
  mapService,
  mapSupplier,
  mapWorkflow,
} from './mappers.js';

function toJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function toEntityRecord(entity: object): Record<string, unknown> {
  return entity as unknown as Record<string, unknown>;
}

export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(organizationId: OrganizationId, id: OrganizationId): Promise<Organization | null> {
    if (organizationId !== id) return null;
    const row = await this.prisma.organization.findUnique({ where: { id: id as string } });
    return row ? mapOrganization(row) : null;
  }

  async findByCode(code: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findUnique({ where: { code } });
    return row ? mapOrganization(row) : null;
  }

  async findByDomain(domain: string): Promise<Organization | null> {
    const rows = await this.prisma.organization.findMany();
    const match = rows.map(mapOrganization).find((org) => org.domain === domain);
    return match ?? null;
  }

  async findByStatus(status: Organization['status']): Promise<readonly Organization[]> {
    const rows = await this.prisma.organization.findMany({ where: { status } });
    return rows.map(mapOrganization);
  }

  async findAll(): Promise<readonly Organization[]> {
    const rows = await this.prisma.organization.findMany();
    return rows.map(mapOrganization);
  }

  async save(entity: Organization): Promise<void> {
    await this.prisma.organization.upsert({
      where: { id: entity.id as string },
      create: {
        id: entity.id as string,
        code: entity.code,
        name: entity.name,
        legalName: entity.legalName,
        registrationNumber: entity.registrationNumber,
        taxId: entity.taxId,
        status: entity.status,
        defaultCurrency: entity.defaultCurrency,
        defaultLocale: entity.defaultLocale,
        timezone: entity.timezone,
        foundedAt: parseDate(entity.foundedAt),
        operatingModel: entity.operatingModel,
        proactiveAiEnabled: entity.proactiveAiEnabled,
        aiCouncilPolicyId: entity.aiCouncilPolicyId ?? null,
        defaultAiSupervisorId: entity.defaultAiSupervisorId ?? null,
        aiDecisionThreshold: entity.aiDecisionThreshold ?? null,
        registeredAgentCount: entity.registeredAgentCount ?? null,
        industryVerticals: [...entity.industryVerticals],
        productionModel: entity.productionModel,
        serviceCoverage: entity.serviceCoverage,
        defaultPaymentTerms: entity.defaultPaymentTerms ?? null,
        defaultSlaTier: entity.defaultSlaTier ?? null,
      },
      update: {
        code: entity.code,
        name: entity.name,
        legalName: entity.legalName,
        registrationNumber: entity.registrationNumber,
        taxId: entity.taxId,
        status: entity.status,
        defaultCurrency: entity.defaultCurrency,
        defaultLocale: entity.defaultLocale,
        timezone: entity.timezone,
        foundedAt: parseDate(entity.foundedAt),
        operatingModel: entity.operatingModel,
        proactiveAiEnabled: entity.proactiveAiEnabled,
        aiCouncilPolicyId: entity.aiCouncilPolicyId ?? null,
        defaultAiSupervisorId: entity.defaultAiSupervisorId ?? null,
        aiDecisionThreshold: entity.aiDecisionThreshold ?? null,
        registeredAgentCount: entity.registeredAgentCount ?? null,
        industryVerticals: [...entity.industryVerticals],
        productionModel: entity.productionModel,
        serviceCoverage: entity.serviceCoverage,
        defaultPaymentTerms: entity.defaultPaymentTerms ?? null,
        defaultSlaTier: entity.defaultSlaTier ?? null,
      },
    });
  }

  async delete(_organizationId: OrganizationId, id: OrganizationId): Promise<void> {
    await this.prisma.organization.delete({ where: { id: id as string } });
  }
}

export class PrismaBranchRepository implements BranchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(organizationId: OrganizationId, id: string): Promise<Branch | null> {
    const row = await this.prisma.branch.findFirst({
      where: { id, organizationId: organizationId as string },
    });
    return row ? mapBranch(row) : null;
  }

  async save(entity: Branch): Promise<void> {
    await this.prisma.branch.upsert({
      where: { id: entity.id as string },
      create: {
        id: entity.id as string,
        organizationId: entity.organizationId as string,
        code: entity.code,
        name: entity.name,
        type: entity.type,
        status: entity.status,
        address: entity.address ? toJson(entity.address) : undefined,
        phone: entity.phone ?? null,
        email: entity.email ?? null,
        currency: entity.currency ?? null,
        timezone: entity.timezone ?? null,
        managerId: entity.managerId ?? null,
        openedAt: parseDate(entity.openedAt),
      },
      update: {
        code: entity.code,
        name: entity.name,
        type: entity.type,
        status: entity.status,
        address: entity.address ? toJson(entity.address) : undefined,
        phone: entity.phone ?? null,
        email: entity.email ?? null,
        currency: entity.currency ?? null,
        timezone: entity.timezone ?? null,
        managerId: entity.managerId ?? null,
        openedAt: parseDate(entity.openedAt),
      },
    });
  }

  async delete(_organizationId: OrganizationId, id: string): Promise<void> {
    await this.prisma.branch.delete({ where: { id } });
  }

  async findByCode(organizationId: OrganizationId, code: string): Promise<Branch | null> {
    const row = await this.prisma.branch.findFirst({
      where: { organizationId: organizationId as string, code },
    });
    return row ? mapBranch(row) : null;
  }

  async findByOrganization(organizationId: OrganizationId): Promise<readonly Branch[]> {
    const rows = await this.prisma.branch.findMany({
      where: { organizationId: organizationId as string },
    });
    return rows.map(mapBranch);
  }
}

function dataJsonRepo<
  TEntity extends { id: unknown; organizationId: OrganizationId; code: string },
>(
  prisma: PrismaClient,
  model: keyof PrismaClient,
  mapper: (row: never) => TEntity,
  coreKeys: string[],
  toRow: (entity: TEntity) => Record<string, unknown>,
) {
  const delegate = prisma[model] as unknown as {
    findFirst: (args: unknown) => Promise<never | null>;
    findMany: (args: unknown) => Promise<never[]>;
    upsert: (args: unknown) => Promise<never>;
    delete: (args: unknown) => Promise<never>;
  };

  return {
    async findById(organizationId: OrganizationId, id: string) {
      const row = await delegate.findFirst({
        where: { id, organizationId: organizationId as string },
      });
      return row ? mapper(row) : null;
    },
    async save(entity: TEntity) {
      const data = toJson(
        extractDataFields(toEntityRecord(entity), [
          'id',
          'organizationId',
          'createdAt',
          'updatedAt',
          ...coreKeys,
        ]),
      );
      await delegate.upsert({
        where: { id: entity.id as string },
        create: {
          id: entity.id as string,
          organizationId: entity.organizationId as string,
          ...toRow(entity),
          data,
        },
        update: { ...toRow(entity), data },
      });
    },
    async delete(_organizationId: OrganizationId, id: string) {
      await delegate.delete({ where: { id } });
    },
    async findByCode(organizationId: OrganizationId, code: string) {
      const row = await delegate.findFirst({
        where: { organizationId: organizationId as string, code },
      });
      return row ? mapper(row) : null;
    },
    async findByOrganization(organizationId: OrganizationId) {
      const rows = await delegate.findMany({
        where: { organizationId: organizationId as string },
      });
      return rows.map(mapper);
    },
  };
}

export function createRepositories(prisma: PrismaClient) {
  const organization = new PrismaOrganizationRepository(prisma);
  const branch = new PrismaBranchRepository(prisma);

  const department = {
    ...dataJsonRepo<Department>(
      prisma,
      'department',
      mapDepartment,
      ['code', 'name', 'status'],
      (e) => ({
        code: e.code,
        name: e.name,
        status: e.status,
        branchId: e.branchId ?? null,
        parentDepartmentId: e.parentDepartmentId ?? null,
        description: e.description ?? null,
        headId: e.headId ?? null,
        costCenter: e.costCenter ?? null,
      }),
    ),
    findByOrganization: async (organizationId: OrganizationId) => {
      const rows = await prisma.department.findMany({
        where: { organizationId: organizationId as string },
      });
      return rows.map(mapDepartment);
    },
  } satisfies DepartmentRepository;

  const employee = {
    async findById(organizationId: OrganizationId, id: string) {
      const row = await prisma.employee.findFirst({
        where: { id, organizationId: organizationId as string },
      });
      return row ? mapEmployee(row) : null;
    },
    async save(entity: Employee) {
      await prisma.employee.upsert({
        where: { id: entity.id as string },
        create: {
          id: entity.id as string,
          organizationId: entity.organizationId as string,
          employeeNumber: entity.employeeNumber,
          firstName: entity.firstName,
          lastName: entity.lastName,
          email: entity.email,
          employmentType: entity.employmentType,
          status: entity.status,
          branchId: entity.branchId ?? null,
          departmentId: entity.departmentId ?? null,
          phone: entity.phone ?? null,
          jobTitle: entity.jobTitle ?? null,
          managerId: entity.managerId ?? null,
          hiredAt: parseDate(entity.hiredAt),
          terminatedAt: parseDate(entity.terminatedAt),
          identityId: entity.identityId ?? null,
          roleIds: entity.roleIds ?? [],
        },
        update: {
          employeeNumber: entity.employeeNumber,
          firstName: entity.firstName,
          lastName: entity.lastName,
          email: entity.email,
          employmentType: entity.employmentType,
          status: entity.status,
          branchId: entity.branchId ?? null,
          departmentId: entity.departmentId ?? null,
          phone: entity.phone ?? null,
          jobTitle: entity.jobTitle ?? null,
          managerId: entity.managerId ?? null,
          hiredAt: parseDate(entity.hiredAt),
          terminatedAt: parseDate(entity.terminatedAt),
          identityId: entity.identityId ?? null,
          roleIds: entity.roleIds ?? [],
        },
      });
    },
    async delete(_organizationId: OrganizationId, id: string) {
      await prisma.employee.delete({ where: { id } });
    },
    async findByEmployeeNumber(organizationId: OrganizationId, employeeNumber: string) {
      const row = await prisma.employee.findFirst({
        where: { organizationId: organizationId as string, employeeNumber },
      });
      return row ? mapEmployee(row) : null;
    },
    async findByEmail(organizationId: OrganizationId, email: string) {
      const row = await prisma.employee.findFirst({
        where: { organizationId: organizationId as string, email },
      });
      return row ? mapEmployee(row) : null;
    },
  } satisfies EmployeeRepository;

  const roleBase = dataJsonRepo<Role>(
    prisma,
    'role',
    mapRole,
    ['code', 'name', 'type', 'status'],
    (e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      description: e.description ?? null,
      parentRoleId: e.parentRoleId ?? null,
      departmentId: e.departmentId ?? null,
      permissionIds: e.permissionIds ?? [],
    }),
  );
  const role = {
    ...roleBase,
    findByType: async (organizationId: OrganizationId, type: Role['type']) => {
      const rows = await prisma.role.findMany({
        where: { organizationId: organizationId as string, type },
      });
      return rows.map(mapRole);
    },
    findByStatus: async (organizationId: OrganizationId, status: Role['status']) => {
      const rows = await prisma.role.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapRole);
    },
  } satisfies RoleRepository;

  const permissionBase = dataJsonRepo<Permission>(
    prisma,
    'permission',
    mapPermission,
    ['code', 'name', 'resource', 'action', 'scope', 'status'],
    (e) => ({
      code: e.code,
      name: e.name,
      resource: e.resource,
      action: e.action,
      scope: e.scope,
      status: e.status,
      description: e.description ?? null,
      policyId: e.policyId ?? null,
    }),
  );
  const permission = {
    ...permissionBase,
    findByResource: async (organizationId: OrganizationId, resource: string) => {
      const rows = await prisma.permission.findMany({
        where: { organizationId: organizationId as string, resource },
      });
      return rows.map(mapPermission);
    },
    findByAction: async (organizationId: OrganizationId, action: Permission['action']) => {
      const rows = await prisma.permission.findMany({
        where: { organizationId: organizationId as string, action },
      });
      return rows.map(mapPermission);
    },
    findByStatus: async (organizationId: OrganizationId, status: Permission['status']) => {
      const rows = await prisma.permission.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapPermission);
    },
  } satisfies PermissionRepository;

  const customerBase = dataJsonRepo<Customer>(
    prisma,
    'customer',
    mapCustomer,
    ['code', 'name', 'type', 'status', 'segment', 'currency'],
    (e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      segment: e.segment,
      currency: e.currency,
    }),
  );
  const customer = {
    ...customerBase,
    findByStatus: async (organizationId: OrganizationId, status: Customer['status']) => {
      const rows = await prisma.customer.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapCustomer);
    },
    findBySegment: async (organizationId: OrganizationId, segment: Customer['segment']) => {
      const rows = await prisma.customer.findMany({
        where: { organizationId: organizationId as string, segment },
      });
      return rows.map(mapCustomer);
    },
  } satisfies CustomerRepository;

  const supplier = dataJsonRepo<Supplier>(
    prisma,
    'supplier',
    mapSupplier,
    ['code', 'name', 'type', 'status'],
    (e) => ({ code: e.code, name: e.name, type: e.type, status: e.status }),
  ) satisfies SupplierRepository;

  const productBase = dataJsonRepo<Product>(
    prisma,
    'product',
    mapProduct,
    ['code', 'name', 'status', 'category', 'currency', 'unitOfMeasure', 'productionType'],
    (e) => ({
      code: e.code,
      name: e.name,
      status: e.status,
      category: e.category,
      currency: e.currency,
      unitOfMeasure: e.unitOfMeasure,
      productionType: e.productionType,
    }),
  );
  const product = {
    ...productBase,
    findByCategory: async (organizationId: OrganizationId, category: Product['category']) => {
      const rows = await prisma.product.findMany({
        where: { organizationId: organizationId as string, category },
      });
      return rows.map(mapProduct);
    },
    findByStatus: async (organizationId: OrganizationId, status: Product['status']) => {
      const rows = await prisma.product.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapProduct);
    },
    findAll: productBase.findByOrganization,
  } satisfies ProductRepository;

  const service = dataJsonRepo<Service>(
    prisma,
    'service',
    mapService,
    ['code', 'name', 'type', 'status', 'pricingModel', 'currency'],
    (e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      pricingModel: e.pricingModel,
      currency: e.currency,
    }),
  ) satisfies ServiceRepository;

  const machineBase = dataJsonRepo<Machine>(
    prisma,
    'machine',
    mapMachine,
    ['branchId', 'code', 'name', 'status', 'ownerDepartmentId', 'category', 'type'],
    (e) => ({
      branchId: e.branchId,
      code: e.code,
      name: e.name,
      status: e.status,
      ownerDepartmentId: e.ownerDepartmentId,
      category: e.category,
      type: e.type,
    }),
  );
  const machine = {
    ...machineBase,
    findByBranch: async (organizationId: OrganizationId, branchId: string) => {
      const rows = await prisma.machine.findMany({
        where: { organizationId: organizationId as string, branchId },
      });
      return rows.map(mapMachine);
    },
    findByStatus: async (organizationId: OrganizationId, status: Machine['status']) => {
      const rows = await prisma.machine.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapMachine);
    },
  } satisfies MachineRepository;

  const projectBase = dataJsonRepo<Project>(
    prisma,
    'project',
    mapProject,
    ['code', 'name', 'status', 'projectType', 'deliveryModel', 'ownerId'],
    (e) => ({
      code: e.code,
      name: e.name,
      status: e.status,
      projectType: e.projectType,
      deliveryModel: e.deliveryModel,
      ownerId: e.ownerId,
    }),
  );
  const project = {
    ...projectBase,
    findByCustomer: async (organizationId: OrganizationId, customerId: string) => {
      const rows = await prisma.project.findMany({
        where: { organizationId: organizationId as string },
      });
      return rows
        .map(mapProject)
        .filter((p) => (p as Project & { customerId?: string }).customerId === customerId);
    },
    findByStatus: async (organizationId: OrganizationId, status: Project['status']) => {
      const rows = await prisma.project.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapProject);
    },
    findByType: async (organizationId: OrganizationId, projectType: Project['projectType']) => {
      const rows = await prisma.project.findMany({
        where: { organizationId: organizationId as string, projectType },
      });
      return rows.map(mapProject);
    },
  } satisfies ProjectRepository;

  const quotationBase = {
    async findById(organizationId: OrganizationId, id: string) {
      const row = await prisma.quotation.findFirst({
        where: { id, organizationId: organizationId as string },
      });
      return row ? mapQuotation(row) : null;
    },
    async save(entity: Quotation) {
      const data = toJson(
        extractDataFields(toEntityRecord(entity), [
          'id',
          'organizationId',
          'number',
          'customerId',
          'status',
          'currency',
          'subtotal',
          'discount',
          'tax',
          'total',
          'lineItems',
          'createdAt',
          'updatedAt',
        ]),
      );
      await prisma.quotation.upsert({
        where: { id: entity.id as string },
        create: {
          id: entity.id as string,
          organizationId: entity.organizationId as string,
          number: entity.number,
          customerId: entity.customerId as string,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          lineItems: toJson(entity.lineItems),
          data,
        },
        update: {
          number: entity.number,
          customerId: entity.customerId as string,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          lineItems: toJson(entity.lineItems),
          data,
        },
      });
    },
    async delete(_organizationId: OrganizationId, id: string) {
      await prisma.quotation.delete({ where: { id } });
    },
    async findByNumber(organizationId: OrganizationId, number: string) {
      const row = await prisma.quotation.findFirst({
        where: { organizationId: organizationId as string, number },
      });
      return row ? mapQuotation(row) : null;
    },
    async findByCustomer(organizationId: OrganizationId, customerId: string) {
      const rows = await prisma.quotation.findMany({
        where: { organizationId: organizationId as string, customerId },
      });
      return rows.map(mapQuotation);
    },
    async findByStatus(organizationId: OrganizationId, status: Quotation['status']) {
      const rows = await prisma.quotation.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapQuotation);
    },
  } satisfies QuotationRepository;

  const orderBase = {
    ...quotationBase,
  };
  void orderBase;
  const order = {
    async findById(organizationId: OrganizationId, id: string) {
      const row = await prisma.order.findFirst({
        where: { id, organizationId: organizationId as string },
      });
      return row ? mapOrder(row) : null;
    },
    async save(entity: Order) {
      const data = toJson(
        extractDataFields(toEntityRecord(entity), [
          'id',
          'organizationId',
          'number',
          'customerId',
          'status',
          'currency',
          'subtotal',
          'discount',
          'tax',
          'total',
          'lineItems',
          'createdAt',
          'updatedAt',
        ]),
      );
      await prisma.order.upsert({
        where: { id: entity.id as string },
        create: {
          id: entity.id as string,
          organizationId: entity.organizationId as string,
          number: entity.number,
          customerId: entity.customerId as string,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          lineItems: toJson(entity.lineItems),
          data,
        },
        update: {
          number: entity.number,
          customerId: entity.customerId as string,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          lineItems: toJson(entity.lineItems),
          data,
        },
      });
    },
    async delete(_organizationId: OrganizationId, id: string) {
      await prisma.order.delete({ where: { id } });
    },
    async findByNumber(organizationId: OrganizationId, number: string) {
      const row = await prisma.order.findFirst({
        where: { organizationId: organizationId as string, number },
      });
      return row ? mapOrder(row) : null;
    },
    async findByCustomer(organizationId: OrganizationId, customerId: string) {
      const rows = await prisma.order.findMany({
        where: { organizationId: organizationId as string, customerId },
      });
      return rows.map(mapOrder);
    },
    async findByProject(organizationId: OrganizationId, projectId: string) {
      const rows = await prisma.order.findMany({
        where: { organizationId: organizationId as string },
      });
      return rows
        .map(mapOrder)
        .filter((o) => (o as Order & { projectId?: string }).projectId === projectId);
    },
    async findByStatus(organizationId: OrganizationId, status: Order['status']) {
      const rows = await prisma.order.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapOrder);
    },
  } satisfies OrderRepository;

  const invoice = {
    async findById(organizationId: OrganizationId, id: string) {
      const row = await prisma.invoice.findFirst({
        where: { id, organizationId: organizationId as string },
      });
      return row ? mapInvoice(row) : null;
    },
    async save(entity: Invoice) {
      const data = toJson(
        extractDataFields(toEntityRecord(entity), [
          'id',
          'organizationId',
          'number',
          'type',
          'status',
          'currency',
          'subtotal',
          'discount',
          'tax',
          'total',
          'amountDue',
          'lineItems',
          'createdAt',
          'updatedAt',
        ]),
      );
      await prisma.invoice.upsert({
        where: { id: entity.id as string },
        create: {
          id: entity.id as string,
          organizationId: entity.organizationId as string,
          number: entity.number,
          type: entity.type,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          amountDue: entity.amountDue,
          lineItems: toJson(entity.lineItems),
          data,
        },
        update: {
          number: entity.number,
          type: entity.type,
          status: entity.status,
          currency: entity.currency,
          subtotal: entity.subtotal,
          discount: entity.discount ?? null,
          tax: entity.tax ?? null,
          total: entity.total,
          amountDue: entity.amountDue,
          lineItems: toJson(entity.lineItems),
          data,
        },
      });
    },
    async delete(_organizationId: OrganizationId, id: string) {
      await prisma.invoice.delete({ where: { id } });
    },
    async findByNumber(organizationId: OrganizationId, number: string) {
      const row = await prisma.invoice.findFirst({
        where: { organizationId: organizationId as string, number },
      });
      return row ? mapInvoice(row) : null;
    },
    async findByCustomer(organizationId: OrganizationId, customerId: string) {
      const rows = await prisma.invoice.findMany({
        where: { organizationId: organizationId as string },
      });
      return rows.map(mapInvoice).filter((i) => i.customerId === customerId);
    },
    async findByStatus(organizationId: OrganizationId, status: Invoice['status']) {
      const rows = await prisma.invoice.findMany({
        where: { organizationId: organizationId as string, status },
      });
      return rows.map(mapInvoice);
    },
  } satisfies InvoiceRepository;

  const workflowBase = dataJsonRepo<Workflow>(
    prisma,
    'workflow',
    mapWorkflow,
    ['code', 'name', 'type', 'status', 'version', 'stages'],
    (e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      version: e.version,
      stages: [...e.stages],
    }),
  );
  const workflow = {
    ...workflowBase,
    findByCodeAndVersion: async (organizationId: OrganizationId, code: string, version: number) => {
      const row = await prisma.workflow.findFirst({
        where: { organizationId: organizationId as string, code, version },
      });
      return row ? mapWorkflow(row) : null;
    },
  } satisfies WorkflowRepository;

  const policyBase = dataJsonRepo<Policy>(
    prisma,
    'policy',
    mapPolicy,
    ['code', 'name', 'type', 'status'],
    (e) => ({ code: e.code, name: e.name, type: e.type, status: e.status }),
  );
  const policy = {
    ...policyBase,
    findByType: async (organizationId: OrganizationId, type: Policy['type']) => {
      const rows = await prisma.policy.findMany({
        where: { organizationId: organizationId as string, type },
      });
      return rows.map(mapPolicy);
    },
    findAll: policyBase.findByOrganization,
  } satisfies PolicyRepository;

  const kpi = dataJsonRepo<Kpi>(
    prisma,
    'kpi',
    mapKpi,
    ['code', 'name', 'type', 'status', 'unit', 'direction', 'frequency'],
    (e) => ({
      code: e.code,
      name: e.name,
      type: e.type,
      status: e.status,
      unit: e.unit,
      direction: e.direction,
      frequency: e.frequency,
    }),
  ) satisfies KpiRepository;

  const asset = dataJsonRepo<Asset>(
    prisma,
    'asset',
    mapAsset,
    ['code', 'name', 'type', 'status'],
    (e) => ({ code: e.code, name: e.name, type: e.type, status: e.status }),
  ) satisfies AssetRepository;

  const agentBase = dataJsonRepo<Agent>(
    prisma,
    'agent',
    mapAgent,
    ['code', 'name', 'workforceType', 'status', 'proactiveEnabled', 'reactiveEnabled'],
    (e) => ({
      code: e.code,
      name: e.name,
      workforceType: e.workforceType,
      status: e.status,
      proactiveEnabled: e.proactiveEnabled,
      reactiveEnabled: e.reactiveEnabled,
    }),
  );
  const agent = {
    ...agentBase,
    findByWorkforceType: async (
      organizationId: OrganizationId,
      workforceType: Agent['workforceType'],
    ) => {
      const rows = await prisma.agent.findMany({
        where: { organizationId: organizationId as string, workforceType },
      });
      return rows.map(mapAgent);
    },
  } satisfies AgentRepository;

  return {
    organization,
    branch,
    department,
    employee,
    role,
    permission,
    customer,
    supplier,
    product,
    service,
    machine,
    project,
    quotation: quotationBase,
    order,
    invoice,
    workflow,
    policy,
    kpi,
    asset,
    agent,
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
