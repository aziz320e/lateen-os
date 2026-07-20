export interface CloudOverview {
  organizations: number;
  tenants: number;
  activeTenants: number;
  deployments: number;
  openTickets: number;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  region: string;
  tenantCount: number;
  createdAt: string;
}

export interface Tenant {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  region: string;
  createdAt: string;
}

export interface PlanDefinition {
  id: string;
  name: string;
  maxUsers: number;
  maxStorageGb: number;
  maxAiTokens: number;
  priceUsd: string;
}

export interface Deployment {
  id: string;
  tenantId: string;
  tenantName: string;
  environment: string;
  region: string;
  version: string;
  status: string;
  deployedAt?: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: string;
  currency: string;
  status: string;
  periodStart: string;
  periodEnd: string;
}

export interface UsageSnapshot {
  tenantId: string;
  metric: string;
  value: number;
  unit: string;
  period: string;
}

export interface SupportTicket {
  id: string;
  organizationId: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export interface MonitoringStatus {
  component: string;
  status: string;
  latencyMs?: number;
  message?: string;
}

export async function fetchOverview(): Promise<CloudOverview> {
  const res = await fetch('/api/cloud');
  if (!res.ok) throw new Error('Failed to load overview');
  return res.json();
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const res = await fetch('/api/organizations');
  if (!res.ok) throw new Error('Failed to load organizations');
  return res.json();
}

export async function fetchTenants(organizationId?: string): Promise<Tenant[]> {
  const url = organizationId ? `/api/tenants?organizationId=${organizationId}` : '/api/tenants';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load tenants');
  return res.json();
}

export async function fetchPlans(): Promise<PlanDefinition[]> {
  const res = await fetch('/api/cloud/plans');
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}

export async function fetchDeployments(): Promise<Deployment[]> {
  const res = await fetch('/api/deployments');
  if (!res.ok) throw new Error('Failed to load deployments');
  return res.json();
}

export async function fetchBilling(): Promise<Invoice[]> {
  const res = await fetch('/api/billing');
  if (!res.ok) throw new Error('Failed to load billing');
  return res.json();
}

export async function fetchUsage(): Promise<UsageSnapshot[]> {
  const res = await fetch('/api/usage');
  if (!res.ok) throw new Error('Failed to load usage');
  return res.json();
}

export async function fetchSupport(): Promise<SupportTicket[]> {
  const res = await fetch('/api/support');
  if (!res.ok) throw new Error('Failed to load support');
  return res.json();
}

export async function fetchMonitoring(): Promise<MonitoringStatus[]> {
  const res = await fetch('/api/cloud/monitoring');
  if (!res.ok) throw new Error('Failed to load monitoring');
  return res.json();
}
