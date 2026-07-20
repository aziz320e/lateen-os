import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';
import type { Agent, Product } from '@lateen-os/business-dna';

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
  ).catch(() => null);
}

export async function listCustomers() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('customers')).catch(() => []);
}

export async function createCustomer(input: { name: string; email?: string }) {
  return bdsFetch<Record<string, unknown>>(orgPath('customers'), {
    method: 'POST',
    body: JSON.stringify({ name: input.name, email: input.email, status: 'active' }),
  });
}

export async function listProjects() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('projects')).catch(() => []);
}

export async function createProject(input: { name: string; customerId?: string }) {
  return bdsFetch<Record<string, unknown>>(orgPath('projects'), {
    method: 'POST',
    body: JSON.stringify({ name: input.name, customerId: input.customerId, status: 'active' }),
  });
}

export async function listQuotations() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('quotations')).catch(() => []);
}

export async function createQuotation(input: { title: string; customerId?: string }) {
  return bdsFetch<Record<string, unknown>>(orgPath('quotations'), {
    method: 'POST',
    body: JSON.stringify({ title: input.title, customerId: input.customerId, status: 'draft' }),
  });
}

export async function listWorkflows() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('workflows')).catch(() => []);
}

export async function listAgents() {
  return bdsFetch<Agent[]>(orgPath('agents')).catch(() => []);
}

export async function listProducts() {
  return bdsFetch<Product[]>(orgPath('products')).catch(() => []);
}

export async function listPolicies() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('policies')).catch(() => []);
}

export async function listKpis() {
  return bdsFetch<Record<string, unknown>[]>(orgPath('kpis')).catch(() => []);
}

export async function fetchEntityCounts() {
  const [customers, projects, workflows, agents, products, policies] = await Promise.all([
    listCustomers(),
    listProjects(),
    listWorkflows(),
    listAgents(),
    listProducts(),
    listPolicies(),
  ]);
  return {
    customers: customers.length,
    projects: projects.length,
    workflows: workflows.length,
    agents: agents.length,
    products: products.length,
    policies: policies.length,
  };
}
