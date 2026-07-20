import { NextResponse } from 'next/server';
import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function fetchList(path: string) {
  const orgId = getOrganizationId();
  const response = await fetch(`${baseUrl}/api/v1/organizations/${orgId}/${path}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return [];
  return response.json() as Promise<Record<string, unknown>[]>;
}

export async function GET() {
  try {
    const orgId = getOrganizationId();
    const orgResponse = await fetch(`${baseUrl}/api/v1/organizations/${orgId}`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    const organization = orgResponse.ok ? await orgResponse.json() : null;

    const [branches, departments, products, machines, agents, projects, customers] = await Promise.all([
      fetchList('branches'),
      fetchList('departments'),
      fetchList('products'),
      fetchList('machines'),
      fetchList('agents'),
      fetchList('projects'),
      fetchList('customers'),
    ]);

    const counts = {
      branches: branches.length,
      departments: departments.length,
      products: products.length,
      machines: machines.length,
      agents: agents.length,
      projects: projects.length,
      customers: customers.length,
    };

    return NextResponse.json({ organization, counts, branches, departments, products, machines, agents, projects });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dashboard failed' }, { status: 502 });
  }
}
