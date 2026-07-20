/** AI Studio design contracts — UI/BFF only, execution in AI Runtime. */

export type DeploymentStatus = 'draft' | 'published' | 'archived';

export type WorkerTool =
  | 'business-dna'
  | 'search'
  | 'knowledge'
  | 'marketplace'
  | 'connectors'
  | 'files'
  | 'email'
  | 'workflow'
  | 'decision'
  | 'mission'
  | 'reports';

export interface WorkerDesign {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly role: string;
  readonly goal: string;
  readonly description: string;
  readonly instructions: string;
  readonly temperaturePolicy: number;
  readonly reasoningPolicy: 'standard' | 'deep' | 'fast';
  readonly memoryAccess: readonly ('working' | 'institutional' | 'knowledge')[];
  readonly businessDnaAccess: boolean;
  readonly institutionalMemoryAccess: boolean;
  readonly knowledgeAccess: boolean;
  readonly decisionPolicy: 'auto' | 'human-in-loop' | 'decision-engine';
  readonly toolPermissions: readonly WorkerTool[];
  readonly connectorPermissions: readonly string[];
  readonly runtimeLimits: { readonly maxTokens: number; readonly timeoutMs: number };
  readonly budgetLimits: { readonly maxCostUsd: string; readonly dailyQuota: number };
  readonly retryPolicy: { readonly attempts: number; readonly delayMs: number };
  readonly fallbackPolicy: { readonly enabled: boolean; readonly workerId?: string };
  readonly status: DeploymentStatus;
  readonly version: number;
  readonly updatedAt: string;
}

export interface PromptDesign {
  readonly workerId: string;
  readonly systemPrompt: string;
  readonly developerPrompt: string;
  readonly userPromptTemplates: readonly { readonly id: string; readonly name: string; readonly template: string }[];
  readonly variables: readonly string[];
  readonly contextInjection: readonly string[];
  readonly outputSchema: string;
  readonly version: number;
}

export interface WorkerTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly role: string;
}

export interface DeploymentRecord {
  readonly id: string;
  readonly workerId: string;
  readonly workerName: string;
  readonly status: DeploymentStatus;
  readonly version: number;
  readonly publishedAt?: string;
  readonly publishedBy?: string;
}

export interface SandboxTestResult {
  readonly conversation: readonly { readonly role: string; readonly content: string }[];
  readonly reasoningTrace: readonly string[];
  readonly tokenUsage: { readonly prompt: number; readonly completion: number };
  readonly latencyMs: number;
  readonly costUsd: string;
  readonly outputValid: boolean;
  readonly note: string;
}

export interface WorkerAnalytics {
  readonly workerId: string;
  readonly usage: number;
  readonly tasks: number;
  readonly avgLatencyMs: number;
  readonly costUsd: string;
  readonly successRate: number;
  readonly failures: number;
  readonly dailyUsage: readonly { readonly date: string; readonly count: number }[];
}

export interface MarketplaceWorkerListing {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly rating: number;
  readonly installs: number;
}

export const STUDIO_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', href: '/' },
  { id: 'workers', label: 'Workers', href: '/workers' },
  { id: 'skills', label: 'Skills', href: '/skills' },
  { id: 'tools', label: 'Tools', href: '/tools' },
  { id: 'permissions', label: 'Permissions', href: '/permissions' },
  { id: 'memory', label: 'Memory', href: '/memory' },
  { id: 'goals', label: 'Goals', href: '/goals' },
  { id: 'knowledge', label: 'Knowledge', href: '/knowledge' },
  { id: 'workflows', label: 'Workflows', href: '/workflows' },
  { id: 'missions', label: 'Missions', href: '/missions' },
  { id: 'runtime', label: 'Runtime', href: '/runtime' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'deployments', label: 'Deployments', href: '/deployments' },
  { id: 'templates', label: 'Templates', href: '/templates' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'prompt-studio', label: 'Prompt Studio', href: '/prompt-studio' },
  { id: 'testing', label: 'Testing', href: '/testing' },
] as const;

export const WORKER_TOOLS: readonly WorkerTool[] = [
  'business-dna', 'search', 'knowledge', 'marketplace', 'connectors',
  'files', 'email', 'workflow', 'decision', 'mission', 'reports',
];
