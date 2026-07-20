import { context, propagation } from '@opentelemetry/api';
import type { Agent, Branch, Customer, Department, Machine, Organization, Product, Project } from '@lateen-os/business-dna';
import type {
  AgentId,
  BranchId,
  CustomerId,
  DepartmentId,
  MachineId,
  OrganizationId,
  ProductId,
  ProjectId,
} from '../../domain/identifiers.js';
import type { BusinessDnaCatalog, BusinessDnaPort } from '../../ports/outbound/business-dna-port.js';
import type { CacheStore } from '../cache/redis-cache.js';

export class BusinessDnaHttpClient implements BusinessDnaPort {
  constructor(
    private readonly baseUrl: string,
    private readonly cache: CacheStore,
  ) {}

  private authHeader(organizationId: OrganizationId): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer dev:${organizationId as string}:product-discovery`,
      'Content-Type': 'application/json',
    };
    propagation.inject(context.active(), headers);
    return headers;
  }

  private async fetchJson<T>(url: string, organizationId: OrganizationId): Promise<T | null> {
    const response = await fetch(url, { headers: this.authHeader(organizationId) });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Business DNA request failed: ${response.status} ${url}`);
    }
    return (await response.json()) as T;
  }

  private async listResource<T>(organizationId: OrganizationId, resource: string): Promise<readonly T[]> {
    const cacheKey = `catalog:${organizationId}:${resource}`;
    const cached = await this.cache.get<readonly T[]>(cacheKey);
    if (cached) return cached;

    const url = `${this.baseUrl}/api/v1/organizations/${organizationId as string}/${resource}`;
    const response = await fetch(url, { headers: this.authHeader(organizationId) });
    if (!response.ok) {
      return [];
    }
    const items = (await response.json()) as T[];
    await this.cache.set(cacheKey, items);
    return items;
  }

  async getOrganization(organizationId: OrganizationId): Promise<Organization | null> {
    const cacheKey = `catalog:${organizationId}:organization`;
    const cached = await this.cache.get<Organization>(cacheKey);
    if (cached) return cached;

    const org = await this.fetchJson<Organization>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}`,
      organizationId,
    );
    if (org) await this.cache.set(cacheKey, org);
    return org;
  }

  listProducts(organizationId: OrganizationId) {
    return this.listResource<Product>(organizationId, 'products');
  }

  getProduct(organizationId: OrganizationId, productId: ProductId) {
    return this.fetchJson<Product>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/products/${productId as string}`,
      organizationId,
    );
  }

  listMachines(organizationId: OrganizationId) {
    return this.listResource<Machine>(organizationId, 'machines');
  }

  getMachine(organizationId: OrganizationId, machineId: MachineId) {
    return this.fetchJson<Machine>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/machines/${machineId as string}`,
      organizationId,
    );
  }

  listProjects(organizationId: OrganizationId) {
    return this.listResource<Project>(organizationId, 'projects');
  }

  getProject(organizationId: OrganizationId, projectId: ProjectId) {
    return this.fetchJson<Project>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/projects/${projectId as string}`,
      organizationId,
    );
  }

  listCustomers(organizationId: OrganizationId) {
    return this.listResource<Customer>(organizationId, 'customers');
  }

  getCustomer(organizationId: OrganizationId, customerId: CustomerId) {
    return this.fetchJson<Customer>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/customers/${customerId as string}`,
      organizationId,
    );
  }

  listBranches(organizationId: OrganizationId) {
    return this.listResource<Branch>(organizationId, 'branches');
  }

  getBranch(organizationId: OrganizationId, branchId: BranchId) {
    return this.fetchJson<Branch>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/branches/${branchId as string}`,
      organizationId,
    );
  }

  listDepartments(organizationId: OrganizationId) {
    return this.listResource<Department>(organizationId, 'departments');
  }

  getDepartment(organizationId: OrganizationId, departmentId: DepartmentId) {
    return this.fetchJson<Department>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/departments/${departmentId as string}`,
      organizationId,
    );
  }

  listAgents(organizationId: OrganizationId) {
    return this.listResource<Agent>(organizationId, 'agents');
  }

  getAgent(organizationId: OrganizationId, agentId: AgentId) {
    return this.fetchJson<Agent>(
      `${this.baseUrl}/api/v1/organizations/${organizationId as string}/agents/${agentId as string}`,
      organizationId,
    );
  }

  async loadCatalog(organizationId: OrganizationId): Promise<BusinessDnaCatalog> {
    const cacheKey = `catalog:${organizationId}:full`;
    const cached = await this.cache.get<BusinessDnaCatalog>(cacheKey);
    if (cached) return cached;

    const [organization, products, machines, projects, customers, branches, departments, agents] =
      await Promise.all([
        this.getOrganization(organizationId),
        this.listProducts(organizationId),
        this.listMachines(organizationId),
        this.listProjects(organizationId),
        this.listCustomers(organizationId),
        this.listBranches(organizationId),
        this.listDepartments(organizationId),
        this.listAgents(organizationId),
      ]);

    const catalog: BusinessDnaCatalog = {
      organization,
      products,
      machines,
      projects,
      customers,
      branches,
      departments,
      agents,
    };
    await this.cache.set(cacheKey, catalog);
    return catalog;
  }
}
