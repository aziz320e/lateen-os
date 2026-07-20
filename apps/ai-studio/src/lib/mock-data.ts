import type {
  DeploymentRecord,
  MarketplaceWorkerListing,
  PromptDesign,
  WorkerAnalytics,
  WorkerDesign,
  WorkerTemplate,
} from './types/studio';

export const MOCK_WORKERS: WorkerDesign[] = [
  {
    id: 'worker-printing-planner',
    organizationId: 'org-1',
    name: 'Printing Planner',
    role: 'Production Planner',
    goal: 'Optimize print production schedules',
    description: 'AI worker for printing industry production planning',
    instructions: 'Analyze orders, machines, and materials to propose optimal schedules.',
    temperaturePolicy: 0.3,
    reasoningPolicy: 'deep',
    memoryAccess: ['working', 'institutional', 'knowledge'],
    businessDnaAccess: true,
    institutionalMemoryAccess: true,
    knowledgeAccess: true,
    decisionPolicy: 'human-in-loop',
    toolPermissions: ['business-dna', 'search', 'knowledge', 'workflow', 'reports'],
    connectorPermissions: ['stripe-connector', 'printing-industry'],
    runtimeLimits: { maxTokens: 8192, timeoutMs: 60_000 },
    budgetLimits: { maxCostUsd: '50.00', dailyQuota: 500 },
    retryPolicy: { attempts: 2, delayMs: 500 },
    fallbackPolicy: { enabled: true, workerId: 'worker-general-assistant' },
    status: 'published',
    version: 3,
    updatedAt: '2026-07-20T10:00:00Z',
  },
  {
    id: 'worker-customer-support',
    organizationId: 'org-1',
    name: 'Customer Support Agent',
    role: 'Support Specialist',
    goal: 'Resolve customer inquiries efficiently',
    description: 'Front-line customer support worker',
    instructions: 'Use knowledge base and CRM data to answer customer questions.',
    temperaturePolicy: 0.5,
    reasoningPolicy: 'standard',
    memoryAccess: ['working', 'knowledge'],
    businessDnaAccess: true,
    institutionalMemoryAccess: false,
    knowledgeAccess: true,
    decisionPolicy: 'auto',
    toolPermissions: ['search', 'knowledge', 'email', 'business-dna'],
    connectorPermissions: [],
    runtimeLimits: { maxTokens: 4096, timeoutMs: 30_000 },
    budgetLimits: { maxCostUsd: '20.00', dailyQuota: 1000 },
    retryPolicy: { attempts: 1, delayMs: 250 },
    fallbackPolicy: { enabled: false },
    status: 'draft',
    version: 1,
    updatedAt: '2026-07-19T14:00:00Z',
  },
];

export const MOCK_TEMPLATES: WorkerTemplate[] = [
  { id: 'tpl-planner', name: 'Production Planner', category: 'Manufacturing', description: 'Schedule optimization worker', role: 'Planner' },
  { id: 'tpl-support', name: 'Support Agent', category: 'Customer Service', description: 'Customer support worker', role: 'Support' },
  { id: 'tpl-analyst', name: 'Business Analyst', category: 'Analytics', description: 'Data analysis worker', role: 'Analyst' },
];

export const MOCK_DEPLOYMENTS: DeploymentRecord[] = [
  { id: 'dep-1', workerId: 'worker-printing-planner', workerName: 'Printing Planner', status: 'published', version: 3, publishedAt: '2026-07-20T10:00:00Z', publishedBy: 'admin@lateen.local' },
  { id: 'dep-2', workerId: 'worker-customer-support', workerName: 'Customer Support Agent', status: 'draft', version: 1 },
];

export const MOCK_PROMPTS: Record<string, PromptDesign> = {
  'worker-printing-planner': {
    workerId: 'worker-printing-planner',
    systemPrompt: 'You are a production planning specialist for the printing industry.',
    developerPrompt: 'Use Business DNA entities for machines, materials, and orders.',
    userPromptTemplates: [{ id: 't1', name: 'Schedule Request', template: 'Plan production for order {{orderId}}' }],
    variables: ['orderId', 'organizationId'],
    contextInjection: ['business-dna', 'knowledge'],
    outputSchema: '{"schedule": [], "conflicts": []}',
    version: 3,
  },
};

export const MOCK_ANALYTICS: WorkerAnalytics[] = [
  {
    workerId: 'worker-printing-planner',
    usage: 1240,
    tasks: 89,
    avgLatencyMs: 2340,
    costUsd: '12.45',
    successRate: 0.94,
    failures: 5,
    dailyUsage: [
      { date: 'Mon', count: 180 },
      { date: 'Tue', count: 210 },
      { date: 'Wed', count: 195 },
      { date: 'Thu', count: 230 },
      { date: 'Fri', count: 425 },
    ],
  },
];

export const MOCK_MARKETPLACE: MarketplaceWorkerListing[] = [
  { id: 'mp-planner', name: 'Print Production Planner', publisher: 'Lateen', rating: 4.8, installs: 120 },
  { id: 'mp-support', name: 'Enterprise Support Bot', publisher: 'Community', rating: 4.2, installs: 45 },
];

export function getWorker(id: string): WorkerDesign | undefined {
  return MOCK_WORKERS.find((w) => w.id === id);
}

export function getPrompt(workerId: string): PromptDesign | undefined {
  return MOCK_PROMPTS[workerId];
}
