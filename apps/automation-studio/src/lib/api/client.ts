import type {
  ActionDefinition,
  AutomationAnalytics,
  AutomationDesign,
  AutomationTemplate,
  ConnectorDefinition,
  ExecutionRecord,
  MarketplaceAutomationListing,
  TriggerDefinition,
} from '@/lib/types/automation';

export async function fetchAutomations(): Promise<AutomationDesign[]> {
  const res = await fetch('/api/automations');
  if (!res.ok) throw new Error('Failed to load automations');
  return res.json();
}

export async function fetchAutomation(id: string): Promise<AutomationDesign> {
  const res = await fetch(`/api/automations/${id}`);
  if (!res.ok) throw new Error('Automation not found');
  return res.json();
}

export async function fetchTemplates(): Promise<AutomationTemplate[]> {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to load templates');
  return res.json();
}

export async function fetchExecutions(): Promise<ExecutionRecord[]> {
  const res = await fetch('/api/executions');
  if (!res.ok) throw new Error('Failed to load executions');
  return res.json();
}

export async function fetchExecution(id: string): Promise<ExecutionRecord> {
  const res = await fetch(`/api/executions/${id}`);
  if (!res.ok) throw new Error('Execution not found');
  return res.json();
}

export async function fetchAnalytics(): Promise<AutomationAnalytics[]> {
  const res = await fetch('/api/analytics');
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchMarketplace(): Promise<MarketplaceAutomationListing[]> {
  const res = await fetch('/api/marketplace');
  if (!res.ok) throw new Error('Failed to load marketplace');
  return res.json();
}

export async function fetchTriggers(): Promise<TriggerDefinition[]> {
  const res = await fetch('/api/triggers');
  if (!res.ok) throw new Error('Failed to load triggers');
  return res.json();
}

export async function fetchActions(): Promise<ActionDefinition[]> {
  const res = await fetch('/api/actions');
  if (!res.ok) throw new Error('Failed to load actions');
  return res.json();
}

export async function fetchConnectors(): Promise<ConnectorDefinition[]> {
  const res = await fetch('/api/connectors');
  if (!res.ok) throw new Error('Failed to load connectors');
  return res.json();
}

export async function fetchLogs(): Promise<readonly { readonly id: string; readonly timestamp: string; readonly level: string; readonly automation: string; readonly message: string }[]> {
  const res = await fetch('/api/logs');
  if (!res.ok) throw new Error('Failed to load logs');
  return res.json();
}

export async function validateAutomation(automationId: string) {
  const res = await fetch('/api/automations/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ automationId }),
  });
  if (!res.ok) throw new Error('Validation failed');
  return res.json();
}
