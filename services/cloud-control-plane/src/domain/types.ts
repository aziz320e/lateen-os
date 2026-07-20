/** Lateen Cloud domain contracts — orchestration only, no business logic. */

export type SubscriptionPlan = 'community' | 'starter' | 'professional' | 'enterprise' | 'partner';

export type TenantStatus = 'provisioning' | 'active' | 'suspended' | 'archived' | 'deleted';

export type TenantLifecycleAction =
  | 'provision'
  | 'activate'
  | 'suspend'
  | 'resume'
  | 'upgrade'
  | 'downgrade'
  | 'archive'
  | 'delete';

export type DeploymentEnvironment = 'development' | 'testing' | 'staging' | 'production';

export type CloudRegion = 'us' | 'europe' | 'middle-east' | 'asia' | 'custom';

export type UsageMetricId =
  | 'users'
  | 'storage'
  | 'api-calls'
  | 'ai-tokens'
  | 'marketplace-extensions'
  | 'connectors'
  | 'workers'
  | 'workflows'
  | 'knowledge-size'
  | 'search-queries';

export type CloudDomain =
  | 'organizations'
  | 'tenants'
  | 'subscriptions'
  | 'plans'
  | 'billing'
  | 'domains'
  | 'regions'
  | 'deployments'
  | 'environments'
  | 'monitoring'
  | 'storage'
  | 'backups'
  | 'restore'
  | 'marketplace'
  | 'extensions'
  | 'users'
  | 'support'
  | 'audit'
  | 'usage';

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly domain?: string;
  readonly region: CloudRegion;
  readonly tenantCount: number;
  readonly createdAt: string;
}

export interface Tenant {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly name: string;
  readonly slug: string;
  readonly status: TenantStatus;
  readonly plan: SubscriptionPlan;
  readonly region: CloudRegion;
  readonly createdAt: string;
}

export interface Subscription {
  readonly id: string;
  readonly tenantId: string;
  readonly plan: SubscriptionPlan;
  readonly status: string;
  readonly startedAt: string;
  readonly expiresAt?: string;
}

export interface Deployment {
  readonly id: string;
  readonly tenantId: string;
  readonly tenantName: string;
  readonly environment: DeploymentEnvironment;
  readonly region: CloudRegion;
  readonly version: string;
  readonly status: string;
  readonly deployedAt?: string;
}

export interface Invoice {
  readonly id: string;
  readonly organizationId: string;
  readonly amount: string;
  readonly currency: string;
  readonly status: 'draft' | 'open' | 'paid' | 'void';
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface UsageSnapshot {
  readonly tenantId: string;
  readonly metric: UsageMetricId;
  readonly value: number;
  readonly unit: string;
  readonly period: string;
}

export interface BackupRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly type: 'manual' | 'scheduled' | 'snapshot';
  readonly status: string;
  readonly sizeBytes: number;
  readonly verified: boolean;
  readonly createdAt: string;
}

export interface SupportTicket {
  readonly id: string;
  readonly organizationId: string;
  readonly subject: string;
  readonly status: string;
  readonly priority: string;
  readonly createdAt: string;
}

export interface MonitoringStatus {
  readonly component: string;
  readonly status: 'healthy' | 'degraded' | 'down';
  readonly latencyMs?: number;
  readonly message?: string;
}

export interface PlanDefinition {
  readonly id: SubscriptionPlan;
  readonly name: string;
  readonly maxUsers: number;
  readonly maxStorageGb: number;
  readonly maxAiTokens: number;
  readonly priceUsd: string;
}

export interface CloudOverview {
  readonly organizations: number;
  readonly tenants: number;
  readonly activeTenants: number;
  readonly deployments: number;
  readonly openTickets: number;
}

export const SUBSCRIPTION_PLANS: readonly SubscriptionPlan[] = [
  'community', 'starter', 'professional', 'enterprise', 'partner',
];

export const TENANT_LIFECYCLE_ACTIONS: readonly TenantLifecycleAction[] = [
  'provision', 'activate', 'suspend', 'resume', 'upgrade', 'downgrade', 'archive', 'delete',
];

export const DEPLOYMENT_ENVIRONMENTS: readonly DeploymentEnvironment[] = [
  'development', 'testing', 'staging', 'production',
];

export const CLOUD_REGIONS: readonly CloudRegion[] = [
  'us', 'europe', 'middle-east', 'asia', 'custom',
];

export const USAGE_METRICS: readonly UsageMetricId[] = [
  'users', 'storage', 'api-calls', 'ai-tokens', 'marketplace-extensions',
  'connectors', 'workers', 'workflows', 'knowledge-size', 'search-queries',
];

export const CLOUD_DOMAINS: readonly CloudDomain[] = [
  'organizations', 'tenants', 'subscriptions', 'plans', 'billing', 'domains',
  'regions', 'deployments', 'environments', 'monitoring', 'storage', 'backups',
  'restore', 'marketplace', 'extensions', 'users', 'support', 'audit', 'usage',
];

export const PLAN_DEFINITIONS: readonly PlanDefinition[] = [
  { id: 'community', name: 'Community', maxUsers: 5, maxStorageGb: 1, maxAiTokens: 10_000, priceUsd: '0.00' },
  { id: 'starter', name: 'Starter', maxUsers: 25, maxStorageGb: 10, maxAiTokens: 100_000, priceUsd: '49.00' },
  { id: 'professional', name: 'Professional', maxUsers: 100, maxStorageGb: 50, maxAiTokens: 1_000_000, priceUsd: '199.00' },
  { id: 'enterprise', name: 'Enterprise', maxUsers: 1000, maxStorageGb: 500, maxAiTokens: 10_000_000, priceUsd: '999.00' },
  { id: 'partner', name: 'Partner', maxUsers: 5000, maxStorageGb: 2000, maxAiTokens: 50_000_000, priceUsd: 'custom' },
];
