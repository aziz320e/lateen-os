import type { LaunchProductMissionState } from '@lateen-os/launch-product-mission/client';

export type AssistantCommand =
  | 'create-customer'
  | 'create-quotation'
  | 'launch-product'
  | 'run-product-discovery'
  | 'approve-decision'
  | 'assign-ai-worker'
  | 'start-workflow'
  | 'create-project'
  | 'show-company-health'
  | 'show-ceo-dashboard'
  | 'search-institutional-memory'
  | 'explain-decisions'
  | 'generate-report'
  | 'help'
  | 'unknown';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    command?: AssistantCommand;
    service?: string;
    traceId?: string;
    chart?: ChartPayload;
    table?: TablePayload;
    code?: string;
  };
}

export interface ChartPayload {
  type: 'bar' | 'line';
  title: string;
  data: { name: string; value: number }[];
}

export interface TablePayload {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface Conversation {
  id: string;
  title: string;
  organizationId: string;
  userId: string;
  pinned: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContext {
  organizationId: string;
  userId: string;
  permissions: string[];
  currentWorkflowId?: string;
  currentMissionId?: string;
  workforceAgentIds: string[];
  memorySnippetCount: number;
}

export interface CommandDefinition {
  id: AssistantCommand;
  label: string;
  slash: string;
  description: string;
  service: string;
  shortcut?: string;
}

export interface OrchestratorResult {
  markdown: string;
  command: AssistantCommand;
  service: string;
  traceId: string;
  chart?: ChartPayload;
  table?: TablePayload;
  code?: string;
  correlation?: {
    missionId?: string;
    decisionId?: string;
    workflowId?: string;
  };
}

export interface MissionView {
  id: string;
  title: string;
  status: string;
  progress: number;
  scenario?: string;
  updatedAt?: string;
}

export interface WorkflowView {
  id: string;
  name: string;
  status: string;
  steps?: number;
}

export interface DecisionView {
  id: string;
  title: string;
  status: string;
  confidence?: number;
  risk?: string;
  reasoning?: string;
}

export interface MemoryEntry {
  id: string;
  category: 'lesson' | 'playbook' | 'policy' | 'research' | 'document';
  title: string;
  summary: string;
  source: string;
  occurredAt: string;
}

export interface SearchResult {
  type: 'memory' | 'decision' | 'mission' | 'workflow' | 'knowledge';
  id: string;
  title: string;
  snippet: string;
  source: string;
}

export type MissionState = LaunchProductMissionState;
