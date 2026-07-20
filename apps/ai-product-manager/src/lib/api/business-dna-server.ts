import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';
import type { Agent, Machine, Product } from '@lateen-os/business-dna';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function bdsFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Business DNA API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function listProducts() {
  const orgId = getOrganizationId();
  return bdsFetch<Product[]>(`/api/v1/organizations/${orgId}/products`);
}

export async function listMachines() {
  const orgId = getOrganizationId();
  return bdsFetch<Machine[]>(`/api/v1/organizations/${orgId}/machines`);
}

export async function listAgents() {
  const orgId = getOrganizationId();
  return bdsFetch<Agent[]>(`/api/v1/organizations/${orgId}/agents`);
}

export async function getOrganization() {
  const orgId = getOrganizationId();
  return bdsFetch<{ id: string; name: string }>(`/api/v1/organizations/${orgId}`);
}
