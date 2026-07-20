import type { AssistantCommand, CommandDefinition } from '@/types';

export const COMMAND_CATALOG: CommandDefinition[] = [
  { id: 'create-customer', label: 'Create Customer', slash: '/create-customer', description: 'Create a customer in Business DNA', service: 'business-dna-service', shortcut: 'Ctrl+Shift+C' },
  { id: 'create-quotation', label: 'Create Quotation', slash: '/create-quotation', description: 'Create a quotation', service: 'business-dna-service' },
  { id: 'launch-product', label: 'Launch Product', slash: '/launch-product', description: 'Start a product launch mission', service: 'ai-product-manager' },
  { id: 'run-product-discovery', label: 'Run Product Discovery', slash: '/run-discovery', description: 'Run product discovery workflow', service: 'product-discovery' },
  { id: 'approve-decision', label: 'Approve Decision', slash: '/approve-decision', description: 'Approve a pending decision', service: 'ai-product-manager' },
  { id: 'assign-ai-worker', label: 'Assign AI Worker', slash: '/assign-worker', description: 'View and assign AI workforce agents', service: 'business-dna-service' },
  { id: 'start-workflow', label: 'Start Workflow', slash: '/start-workflow', description: 'List or start workflows', service: 'business-dna-service' },
  { id: 'create-project', label: 'Create Project', slash: '/create-project', description: 'Create a project', service: 'business-dna-service' },
  { id: 'show-company-health', label: 'Show Company Health', slash: '/company-health', description: 'Platform and org health snapshot', service: 'ceo-cockpit' },
  { id: 'show-ceo-dashboard', label: 'Show CEO Dashboard', slash: '/ceo-dashboard', description: 'Executive dashboard summary', service: 'ceo-cockpit' },
  { id: 'search-institutional-memory', label: 'Search Memory', slash: '/search-memory', description: 'Search institutional memory', service: 'ceo-cockpit' },
  { id: 'explain-decisions', label: 'Explain Decisions', slash: '/explain-decisions', description: 'Explain pending and recent decisions', service: 'ai-product-manager' },
  { id: 'generate-report', label: 'Generate Report', slash: '/report', description: 'Generate an executive summary report', service: 'lateen-assistant' },
  { id: 'help', label: 'Help', slash: '/help', description: 'List available commands', service: 'lateen-assistant' },
];

const KEYWORD_MAP: { pattern: RegExp; command: AssistantCommand }[] = [
  { pattern: /^\/help\b|^help$/i, command: 'help' },
  { pattern: /^\/create-customer\b|create customer/i, command: 'create-customer' },
  { pattern: /^\/create-quotation\b|create quotation/i, command: 'create-quotation' },
  { pattern: /^\/launch-product\b|launch product/i, command: 'launch-product' },
  { pattern: /^\/run-discovery\b|run product discovery|run discovery/i, command: 'run-product-discovery' },
  { pattern: /^\/approve-decision\b|approve decision/i, command: 'approve-decision' },
  { pattern: /^\/assign-worker\b|assign ai worker|assign worker/i, command: 'assign-ai-worker' },
  { pattern: /^\/start-workflow\b|start workflow/i, command: 'start-workflow' },
  { pattern: /^\/create-project\b|create project/i, command: 'create-project' },
  { pattern: /^\/company-health\b|show company health|company health/i, command: 'show-company-health' },
  { pattern: /^\/ceo-dashboard\b|show ceo dashboard|ceo dashboard/i, command: 'show-ceo-dashboard' },
  { pattern: /^\/search-memory\b|search institutional memory|search memory/i, command: 'search-institutional-memory' },
  { pattern: /^\/explain-decisions\b|explain decisions/i, command: 'explain-decisions' },
  { pattern: /^\/report\b|generate report/i, command: 'generate-report' },
];

export function detectCommand(message: string): AssistantCommand {
  const trimmed = message.trim();
  for (const { pattern, command } of KEYWORD_MAP) {
    if (pattern.test(trimmed)) return command;
  }
  return 'unknown';
}

export function searchCommands(query: string): CommandDefinition[] {
  const q = query.toLowerCase().replace(/^\//, '');
  if (!q) return COMMAND_CATALOG;
  return COMMAND_CATALOG.filter(
    (c) =>
      c.label.toLowerCase().includes(q) ||
      c.slash.includes(q) ||
      c.description.toLowerCase().includes(q),
  );
}

export function getCommandDefinition(command: AssistantCommand): CommandDefinition | undefined {
  return COMMAND_CATALOG.find((c) => c.id === command);
}
