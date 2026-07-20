import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';
import type { Agent, Department, Employee, Machine, Product } from '@lateen-os/business-dna';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function bdsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...init?.headers },
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Business DNA API ${response.status}: ${path}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function orgPath(entity: string) {
  return `/api/v1/organizations/${getOrganizationId()}/${entity}`;
}

export async function getOrganization() {
  return bdsFetch<{ id: string; name: string; legalName?: string }>(
    `/api/v1/organizations/${getOrganizationId()}`,
  );
}

export async function listProducts() {
  return bdsFetch<Product[]>(orgPath('products')).catch(() => []);
}

export async function listMachines() {
  return bdsFetch<Machine[]>(orgPath('machines')).catch(() => []);
}

export async function listAgents() {
  return bdsFetch<Agent[]>(orgPath('agents')).catch(() => []);
}

export async function listDepartments() {
  return bdsFetch<Department[]>(orgPath('departments')).catch(() => []);
}

export async function listEmployees() {
  return bdsFetch<Employee[]>(orgPath('employees')).catch(() => []);
}

export async function listCustomers() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('customers')).catch(() => []);
}

export async function listProjects() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('projects')).catch(() => []);
}

export async function listBranches() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('branches')).catch(() => []);
}

export async function listWorkflows() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('workflows')).catch(() => []);
}

export async function listPolicies() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('policies')).catch(() => []);
}

export async function listKpis() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('kpis')).catch(() => []);
}

export async function listInvoices() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('invoices')).catch(() => []);
}

export async function listOrders() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('orders')).catch(() => []);
}

export async function fetchEntityCounts() {
  const [branches, departments, employees, products, machines, agents, customers, projects, workflows, policies] =
    await Promise.all([
      listBranches(),
      listDepartments(),
      listEmployees(),
      listProducts(),
      listMachines(),
      listAgents(),
      listCustomers(),
      listProjects(),
      listWorkflows(),
      listPolicies(),
    ]);

  return {
    branches: branches.length,
    departments: departments.length,
    employees: employees.length,
    products: products.length,
    machines: machines.length,
    agents: agents.length,
    customers: customers.length,
    projects: projects.length,
    workflows: workflows.length,
    policies: policies.length,
  };
}
