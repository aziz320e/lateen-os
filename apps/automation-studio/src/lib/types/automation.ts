/** Automation Studio design contracts — UI/BFF only, execution in Workflow Engine. */

export type AutomationStatus = 'draft' | 'published' | 'archived';

export type FlowNodeType =
  | 'trigger'
  | 'condition'
  | 'decision'
  | 'workflow'
  | 'mission'
  | 'ai-worker'
  | 'human-task'
  | 'approval'
  | 'notification'
  | 'email'
  | 'webhook'
  | 'connector'
  | 'business-dna'
  | 'knowledge-search'
  | 'enterprise-search'
  | 'delay'
  | 'loop'
  | 'switch'
  | 'parallel'
  | 'merge'
  | 'script';

export type TriggerType =
  | 'manual'
  | 'cron'
  | 'webhook'
  | 'business-event'
  | 'marketplace-event'
  | 'connector-event'
  | 'threshold'
  | 'timer'
  | 'mission-completed'
  | 'workflow-completed'
  | 'decision-approved';

export type ActionType =
  | 'create-customer'
  | 'create-project'
  | 'create-quotation'
  | 'create-order'
  | 'launch-mission'
  | 'run-workflow'
  | 'run-ai-worker'
  | 'approve-decision'
  | 'reject-decision'
  | 'send-email'
  | 'send-notification'
  | 'connector-sync'
  | 'knowledge-import'
  | 'marketplace-install';

export type ExecutionStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';

export interface FlowNode {
  readonly id: string;
  readonly type: FlowNodeType;
  readonly label: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly groupId?: string;
}

export interface FlowEdge {
  readonly id: string;
  readonly source: string;
  readonly target: string;
  readonly label?: string;
}

export interface AutomationDesign {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly description: string;
  readonly triggerType: TriggerType;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowEdge[];
  readonly variables: readonly { readonly key: string; readonly type: string; readonly defaultValue?: string }[];
  readonly schedule?: string;
  readonly status: AutomationStatus;
  readonly version: number;
  readonly updatedAt: string;
}

export interface AutomationTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly description: string;
  readonly nodeCount: number;
}

export interface ExecutionRecord {
  readonly id: string;
  readonly automationId: string;
  readonly automationName: string;
  readonly status: 'running' | 'completed' | 'failed' | 'cancelled';
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
  readonly steps: readonly ExecutionStep[];
  readonly decisionTrace: readonly string[];
  readonly workerTrace: readonly string[];
}

export interface ExecutionStep {
  readonly id: string;
  readonly nodeId: string;
  readonly label: string;
  readonly status: ExecutionStepStatus;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly durationMs?: number;
  readonly retries: number;
  readonly error?: string;
}

export interface AutomationAnalytics {
  readonly automationId: string;
  readonly executionCount: number;
  readonly successRate: number;
  readonly failureRate: number;
  readonly avgDurationMs: number;
  readonly retryCount: number;
  readonly dailyExecutions: readonly { readonly date: string; readonly count: number }[];
}

export interface MarketplaceAutomationListing {
  readonly id: string;
  readonly name: string;
  readonly publisher: string;
  readonly rating: number;
  readonly installs: number;
}

export interface TriggerDefinition {
  readonly type: TriggerType;
  readonly label: string;
  readonly description: string;
}

export interface ActionDefinition {
  readonly type: ActionType;
  readonly label: string;
  readonly category: string;
}

export interface ConnectorDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly status: 'available' | 'connected';
}

export const STUDIO_SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', href: '/' },
  { id: 'automations', label: 'Automations', href: '/automations' },
  { id: 'workflow-builder', label: 'Workflow Builder', href: '/workflow-builder' },
  { id: 'mission-builder', label: 'Mission Builder', href: '/mission-builder' },
  { id: 'decision-builder', label: 'Decision Builder', href: '/decision-builder' },
  { id: 'triggers', label: 'Trigger Library', href: '/triggers' },
  { id: 'actions', label: 'Action Library', href: '/actions' },
  { id: 'conditions', label: 'Condition Builder', href: '/conditions' },
  { id: 'variables', label: 'Variables', href: '/variables' },
  { id: 'schedules', label: 'Schedules', href: '/schedules' },
  { id: 'connectors', label: 'Connector Library', href: '/connectors' },
  { id: 'templates', label: 'Templates', href: '/templates' },
  { id: 'executions', label: 'Executions', href: '/executions' },
  { id: 'logs', label: 'Logs', href: '/logs' },
  { id: 'analytics', label: 'Analytics', href: '/analytics' },
  { id: 'marketplace', label: 'Marketplace', href: '/marketplace' },
  { id: 'settings', label: 'Settings', href: '/settings' },
] as const;

export const FLOW_NODE_TYPES: readonly FlowNodeType[] = [
  'trigger', 'condition', 'decision', 'workflow', 'mission', 'ai-worker',
  'human-task', 'approval', 'notification', 'email', 'webhook', 'connector',
  'business-dna', 'knowledge-search', 'enterprise-search', 'delay', 'loop',
  'switch', 'parallel', 'merge', 'script',
];

export const TRIGGER_TYPES: readonly TriggerType[] = [
  'manual', 'cron', 'webhook', 'business-event', 'marketplace-event',
  'connector-event', 'threshold', 'timer', 'mission-completed',
  'workflow-completed', 'decision-approved',
];

export const ACTION_TYPES: readonly ActionType[] = [
  'create-customer', 'create-project', 'create-quotation', 'create-order',
  'launch-mission', 'run-workflow', 'run-ai-worker', 'approve-decision',
  'reject-decision', 'send-email', 'send-notification', 'connector-sync',
  'knowledge-import', 'marketplace-install',
];
