/** @module ports/outbound/business-dna-port */
import type {
  Agent,
  Branch,
  Customer,
  Department,
  Machine,
  Organization,
  Product,
  Project,
} from '@lateen-os/business-dna';
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

/** Outbound port to Business DNA — organization context and catalog. */
export interface BusinessDnaPort {
  getOrganization(organizationId: OrganizationId): Promise<Organization | null>;

  listProducts(organizationId: OrganizationId): Promise<readonly Product[]>;
  getProduct(organizationId: OrganizationId, productId: ProductId): Promise<Product | null>;

  listMachines(organizationId: OrganizationId): Promise<readonly Machine[]>;
  getMachine(organizationId: OrganizationId, machineId: MachineId): Promise<Machine | null>;

  listProjects(organizationId: OrganizationId): Promise<readonly Project[]>;
  getProject(organizationId: OrganizationId, projectId: ProjectId): Promise<Project | null>;

  listCustomers(organizationId: OrganizationId): Promise<readonly Customer[]>;
  getCustomer(organizationId: OrganizationId, customerId: CustomerId): Promise<Customer | null>;

  listBranches(organizationId: OrganizationId): Promise<readonly Branch[]>;
  getBranch(organizationId: OrganizationId, branchId: BranchId): Promise<Branch | null>;

  listDepartments(organizationId: OrganizationId): Promise<readonly Department[]>;
  getDepartment(organizationId: OrganizationId, departmentId: DepartmentId): Promise<Department | null>;

  listAgents(organizationId: OrganizationId): Promise<readonly Agent[]>;
  getAgent(organizationId: OrganizationId, agentId: AgentId): Promise<Agent | null>;

  /** Load full tenant catalog for discovery workflows. */
  loadCatalog(organizationId: OrganizationId): Promise<BusinessDnaCatalog>;
}

export interface BusinessDnaCatalog {
  readonly organization: Organization | null;
  readonly products: readonly Product[];
  readonly machines: readonly Machine[];
  readonly projects: readonly Project[];
  readonly customers: readonly Customer[];
  readonly branches: readonly Branch[];
  readonly departments: readonly Department[];
  readonly agents: readonly Agent[];
}
