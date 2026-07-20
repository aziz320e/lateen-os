import { NextResponse } from 'next/server';
import { getAuthHeaders, getOrganizationId } from '@/lib/auth';
import { serverEnv } from '@/lib/env';

const baseUrl = serverEnv.NEXT_PUBLIC_LATEEN_BUSINESS_DNA_BASE_URL;

async function count(path: string) {
  const orgId = getOrganizationId();
  const response = await fetch(`${baseUrl}/api/v1/organizations/${orgId}/${path}`, {
    headers: getAuthHeaders(),
    cache: 'no-store',
  });
  if (!response.ok) return 0;
  const items = (await response.json()) as unknown[];
  return items.length;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get('resource') ?? 'products';
  const entityId = searchParams.get('entityId') ?? '';

  const dependents: { type: string; count: number; label: string }[] = [];

  if (resource === 'departments') {
    dependents.push({ type: 'employees', count: 0, label: 'Assigned employees' });
    dependents.push({ type: 'agents', count: await count('agents'), label: 'AI agents in org' });
  }
  if (resource === 'products') {
    dependents.push({ type: 'projects', count: await count('projects'), label: 'Active projects' });
    dependents.push({ type: 'machines', count: await count('machines'), label: 'Manufacturing machines' });
  }
  if (resource === 'machines') {
    dependents.push({ type: 'products', count: await count('products'), label: 'Linked products' });
  }
  if (resource === 'agents') {
    dependents.push({ type: 'workflows', count: 0, label: 'Workflow assignments' });
  }

  const total = dependents.reduce((sum, d) => sum + d.count, 0);
  const risk = total > 10 ? 'high' : total > 3 ? 'medium' : 'low';

  return NextResponse.json({ resource, entityId, dependents, risk });
}
