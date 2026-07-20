/** Provisioning domain contracts — orchestration only, no business logic. */

export type ProvisioningProfile =
  | 'small-business'
  | 'enterprise'
  | 'manufacturing'
  | 'printing'
  | 'retail'
  | 'healthcare'
  | 'construction';

export type ProvisioningStatus = 'pending' | 'running' | 'completed' | 'failed';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export const PROVISIONING_STEP_IDS = [
  'validate-request',
  'create-organization',
  'create-tenant',
  'create-identity',
  'create-administrator',
  'install-marketplace-extensions',
  'install-industry-pack',
  'create-business-dna',
  'create-departments',
  'create-roles',
  'create-permissions',
  'create-ai-workforce',
  'create-workflows',
  'create-dashboards',
  'create-kpis',
  'run-health-checks',
  'generate-report',
] as const;

export type ProvisioningStepId = (typeof PROVISIONING_STEP_IDS)[number];

export interface ProvisioningStepDefinition {
  readonly id: ProvisioningStepId;
  readonly name: string;
  readonly service: string;
}

export interface ProvisioningRequest {
  readonly organizationName: string;
  readonly profile: ProvisioningProfile;
  readonly industry?: string;
  readonly country?: string;
  readonly timezone?: string;
  readonly currency?: string;
  readonly language?: string;
  readonly employeeCount?: number;
  readonly extensions?: readonly string[];
  readonly aiWorkers?: readonly string[];
}

export interface ProvisioningStepResult {
  readonly stepId: ProvisioningStepId;
  readonly status: StepStatus;
  readonly message: string;
  readonly output?: Record<string, unknown>;
  readonly startedAt?: string;
  readonly completedAt?: string;
}

export interface ProvisioningJob {
  readonly id: string;
  readonly organizationName: string;
  readonly profile: ProvisioningProfile;
  readonly industry?: string;
  readonly country?: string;
  readonly timezone: string;
  readonly currency: string;
  readonly language: string;
  readonly employeeCount: number;
  readonly extensions: readonly string[];
  readonly aiWorkers: readonly string[];
  readonly status: ProvisioningStatus;
  readonly currentStep?: ProvisioningStepId;
  readonly steps: readonly ProvisioningStepResult[];
  readonly report?: ProvisioningReport;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt?: string;
}

export interface ProvisioningReport {
  readonly jobId: string;
  readonly organizationId: string;
  readonly tenantId: string;
  readonly profile: ProvisioningProfile;
  readonly stepsCompleted: number;
  readonly stepsTotal: number;
  readonly healthStatus: 'healthy' | 'degraded' | 'failed';
  readonly summary: string;
  readonly generatedAt: string;
}

export interface ProvisioningStatusSummary {
  readonly total: number;
  readonly pending: number;
  readonly running: number;
  readonly completed: number;
  readonly failed: number;
}

export const PROVISIONING_STEPS: ProvisioningStepDefinition[] = [
  { id: 'validate-request', name: 'Validate Request', service: 'provisioning' },
  { id: 'create-organization', name: 'Create Organization', service: 'business-dna' },
  { id: 'create-tenant', name: 'Create Tenant', service: 'identity' },
  { id: 'create-identity', name: 'Create Identity', service: 'identity' },
  { id: 'create-administrator', name: 'Create Administrator', service: 'identity' },
  { id: 'install-marketplace-extensions', name: 'Install Marketplace Extensions', service: 'marketplace' },
  { id: 'install-industry-pack', name: 'Install Industry Pack', service: 'marketplace' },
  { id: 'create-business-dna', name: 'Create Business DNA', service: 'business-dna' },
  { id: 'create-departments', name: 'Create Departments', service: 'business-dna' },
  { id: 'create-roles', name: 'Create Roles', service: 'identity' },
  { id: 'create-permissions', name: 'Create Permissions', service: 'identity' },
  { id: 'create-ai-workforce', name: 'Create AI Workforce', service: 'ai-workforce' },
  { id: 'create-workflows', name: 'Create Workflows', service: 'workflow-engine' },
  { id: 'create-dashboards', name: 'Create Dashboards', service: 'analytics' },
  { id: 'create-kpis', name: 'Create KPIs', service: 'business-dna' },
  { id: 'run-health-checks', name: 'Run Health Checks', service: 'kernel' },
  { id: 'generate-report', name: 'Generate Provisioning Report', service: 'provisioning' },
];
