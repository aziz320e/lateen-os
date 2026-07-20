import type {
  ActionDefinition,
  AutomationAnalytics,
  AutomationDesign,
  AutomationTemplate,
  ConnectorDefinition,
  ExecutionRecord,
  MarketplaceAutomationListing,
  TriggerDefinition,
} from './types/automation';
import { ACTION_TYPES, TRIGGER_TYPES } from './types/automation';

export const MOCK_AUTOMATIONS: AutomationDesign[] = [
  {
    id: 'auto-sales-followup',
    organizationId: 'org-1',
    name: 'Sales Follow-up',
    description: 'Automated follow-up after quotation sent',
    triggerType: 'business-event',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Quotation Sent', position: { x: 0, y: 0 } },
      { id: 'n2', type: 'delay', label: 'Wait 3 Days', position: { x: 200, y: 0 } },
      { id: 'n3', type: 'ai-worker', label: 'Follow-up Agent', position: { x: 400, y: 0 } },
      { id: 'n4', type: 'email', label: 'Send Email', position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
    variables: [{ key: 'quotationId', type: 'string' }, { key: 'customerId', type: 'string' }],
    status: 'published',
    version: 2,
    updatedAt: '2026-07-20T11:00:00Z',
  },
  {
    id: 'auto-procurement-approval',
    organizationId: 'org-1',
    name: 'Procurement Approval',
    description: 'Multi-step approval for purchase orders',
    triggerType: 'manual',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Manual Start', position: { x: 0, y: 0 } },
      { id: 'n2', type: 'condition', label: 'Amount > 10k', position: { x: 200, y: 0 } },
      { id: 'n3', type: 'decision', label: 'Manager Approval', position: { x: 400, y: -50 } },
      { id: 'n4', type: 'approval', label: 'Auto Approve', position: { x: 400, y: 50 } },
      { id: 'n5', type: 'notification', label: 'Notify Finance', position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3', label: 'yes' },
      { id: 'e3', source: 'n2', target: 'n4', label: 'no' },
      { id: 'e4', source: 'n3', target: 'n5' },
      { id: 'e5', source: 'n4', target: 'n5' },
    ],
    variables: [{ key: 'orderId', type: 'string' }, { key: 'amount', type: 'number' }],
    status: 'published',
    version: 1,
    updatedAt: '2026-07-19T09:00:00Z',
  },
  {
    id: 'auto-printing-workflow',
    organizationId: 'org-1',
    name: 'Printing Production Workflow',
    description: 'End-to-end printing production automation',
    triggerType: 'cron',
    schedule: '0 6 * * 1-5',
    nodes: [
      { id: 'n1', type: 'trigger', label: 'Daily Schedule', position: { x: 0, y: 0 } },
      { id: 'n2', type: 'business-dna', label: 'Load Orders', position: { x: 200, y: 0 } },
      { id: 'n3', type: 'ai-worker', label: 'Production Planner', position: { x: 400, y: 0 } },
      { id: 'n4', type: 'mission', label: 'Launch Production', position: { x: 600, y: 0 } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
      { id: 'e3', source: 'n3', target: 'n4' },
    ],
    variables: [],
    status: 'draft',
    version: 1,
    updatedAt: '2026-07-18T14:00:00Z',
  },
];

export const MOCK_TEMPLATES: AutomationTemplate[] = [
  { id: 'tpl-sales-followup', name: 'Sales Follow-up', category: 'Sales', description: 'Follow up after quotation', nodeCount: 4 },
  { id: 'tpl-onboarding', name: 'Customer Onboarding', category: 'CRM', description: 'New customer onboarding flow', nodeCount: 8 },
  { id: 'tpl-product-launch', name: 'Product Launch', category: 'Marketing', description: 'Product launch automation', nodeCount: 12 },
  { id: 'tpl-procurement', name: 'Procurement Approval', category: 'Finance', description: 'Purchase order approval', nodeCount: 6 },
  { id: 'tpl-invoice-reminder', name: 'Invoice Reminder', category: 'Finance', description: 'Overdue invoice reminders', nodeCount: 5 },
  { id: 'tpl-production', name: 'Production Planning', category: 'Manufacturing', description: 'Daily production planning', nodeCount: 7 },
  { id: 'tpl-printing', name: 'Printing Workflow', category: 'Printing', description: 'Print production workflow', nodeCount: 10 },
];

export const MOCK_EXECUTIONS: ExecutionRecord[] = [
  {
    id: 'exec-001',
    automationId: 'auto-sales-followup',
    automationName: 'Sales Follow-up',
    status: 'completed',
    startedAt: '2026-07-20T10:00:00Z',
    completedAt: '2026-07-20T10:02:15Z',
    durationMs: 135_000,
    steps: [
      { id: 's1', nodeId: 'n1', label: 'Quotation Sent', status: 'completed', startedAt: '2026-07-20T10:00:00Z', completedAt: '2026-07-20T10:00:01Z', durationMs: 1000, retries: 0 },
      { id: 's2', nodeId: 'n2', label: 'Wait 3 Days', status: 'completed', startedAt: '2026-07-20T10:00:01Z', completedAt: '2026-07-20T10:00:02Z', durationMs: 1000, retries: 0 },
      { id: 's3', nodeId: 'n3', label: 'Follow-up Agent', status: 'completed', startedAt: '2026-07-20T10:00:02Z', completedAt: '2026-07-20T10:02:10Z', durationMs: 128_000, retries: 0 },
      { id: 's4', nodeId: 'n4', label: 'Send Email', status: 'completed', startedAt: '2026-07-20T10:02:10Z', completedAt: '2026-07-20T10:02:15Z', durationMs: 5000, retries: 0 },
    ],
    decisionTrace: [],
    workerTrace: ['AI Runtime: worker-customer-support invoked', 'Token usage: 450 prompt + 120 completion'],
  },
  {
    id: 'exec-002',
    automationId: 'auto-procurement-approval',
    automationName: 'Procurement Approval',
    status: 'failed',
    startedAt: '2026-07-20T09:30:00Z',
    completedAt: '2026-07-20T09:31:45Z',
    durationMs: 105_000,
    steps: [
      { id: 's1', nodeId: 'n1', label: 'Manual Start', status: 'completed', startedAt: '2026-07-20T09:30:00Z', completedAt: '2026-07-20T09:30:01Z', durationMs: 1000, retries: 0 },
      { id: 's2', nodeId: 'n2', label: 'Amount > 10k', status: 'completed', startedAt: '2026-07-20T09:30:01Z', completedAt: '2026-07-20T09:30:02Z', durationMs: 1000, retries: 0 },
      { id: 's3', nodeId: 'n3', label: 'Manager Approval', status: 'failed', startedAt: '2026-07-20T09:30:02Z', completedAt: '2026-07-20T09:31:45Z', durationMs: 103_000, retries: 2, error: 'Decision Engine timeout' },
    ],
    decisionTrace: ['Decision Engine: approval request created', 'Decision Engine: timeout after 60s'],
    workerTrace: [],
  },
];

export const MOCK_ANALYTICS: AutomationAnalytics[] = [
  {
    automationId: 'auto-sales-followup',
    executionCount: 342,
    successRate: 0.96,
    failureRate: 0.04,
    avgDurationMs: 128_000,
    retryCount: 12,
    dailyExecutions: [
      { date: 'Mon', count: 45 },
      { date: 'Tue', count: 52 },
      { date: 'Wed', count: 48 },
      { date: 'Thu', count: 61 },
      { date: 'Fri', count: 136 },
    ],
  },
  {
    automationId: 'auto-procurement-approval',
    executionCount: 89,
    successRate: 0.91,
    failureRate: 0.09,
    avgDurationMs: 95_000,
    retryCount: 8,
    dailyExecutions: [
      { date: 'Mon', count: 12 },
      { date: 'Tue', count: 18 },
      { date: 'Wed', count: 15 },
      { date: 'Thu', count: 22 },
      { date: 'Fri', count: 22 },
    ],
  },
];

export const MOCK_MARKETPLACE: MarketplaceAutomationListing[] = [
  { id: 'mp-sales', name: 'Enterprise Sales Pipeline', publisher: 'Lateen', rating: 4.7, installs: 85 },
  { id: 'mp-onboard', name: 'Customer Onboarding Pro', publisher: 'Community', rating: 4.3, installs: 42 },
];

export const MOCK_TRIGGERS: TriggerDefinition[] = TRIGGER_TYPES.map((type) => ({
  type,
  label: type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  description: `Trigger automation on ${type.replace(/-/g, ' ')} event`,
}));

export const MOCK_ACTIONS: ActionDefinition[] = ACTION_TYPES.map((type) => ({
  type,
  label: type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  category: type.startsWith('create-') ? 'Business DNA' : type.includes('decision') ? 'Decision' : type.includes('mission') || type.includes('workflow') || type.includes('worker') ? 'Orchestration' : 'Integration',
}));

export const MOCK_CONNECTORS: ConnectorDefinition[] = [
  { id: 'stripe', name: 'Stripe', category: 'Payments', status: 'connected' },
  { id: 'printing-industry', name: 'Printing Industry Pack', category: 'Industry', status: 'connected' },
  { id: 'google-workspace', name: 'Google Workspace', category: 'Productivity', status: 'available' },
  { id: 'slack', name: 'Slack', category: 'Communication', status: 'available' },
];

export function getAutomation(id: string): AutomationDesign | undefined {
  return MOCK_AUTOMATIONS.find((a) => a.id === id);
}

export function getExecution(id: string): ExecutionRecord | undefined {
  return MOCK_EXECUTIONS.find((e) => e.id === id);
}

export const MOCK_LOGS = [
  { id: 'log-1', timestamp: '2026-07-20T10:02:15Z', level: 'info', automation: 'Sales Follow-up', message: 'Execution exec-001 completed' },
  { id: 'log-2', timestamp: '2026-07-20T09:31:45Z', level: 'error', automation: 'Procurement Approval', message: 'Step n3 failed: Decision Engine timeout' },
  { id: 'log-3', timestamp: '2026-07-20T09:30:00Z', level: 'info', automation: 'Procurement Approval', message: 'Execution exec-002 started' },
];
