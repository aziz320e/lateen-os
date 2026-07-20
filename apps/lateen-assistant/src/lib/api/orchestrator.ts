import { randomUUID } from 'node:crypto';
import {
  createCustomer,
  createProject,
  createQuotation,
  fetchEntityCounts,
  getOrganization,
  listAgents,
  listPolicies,
  listProducts,
  listProjects,
  listWorkflows,
} from '@/lib/api/business-dna-server';
import { fetchDecisions, fetchMissions, startMission, approveDecision, fetchDashboardSummary } from '@/lib/api/ai-pm-server';
import { runDiscovery, listRecommendations, getPlatformHealth } from '@/lib/api/discovery-server';
import { fetchExecutiveDashboard, fetchPlatformHealth, fetchCockpitMemory } from '@/lib/api/cockpit-server';
import { listConnectors } from '@/lib/api/integration-hub-server';
import { recordTrace } from '@/lib/audit';
import { COMMAND_CATALOG, detectCommand, getCommandDefinition } from '@/lib/api/command-router';
import type { AssistantCommand, MemoryEntry, OrchestratorResult } from '@/types';

function extractArg(message: string, prefix: string): string {
  const lower = message.toLowerCase();
  const idx = lower.indexOf(prefix.toLowerCase());
  if (idx === -1) return message.replace(/^\//, '').trim();
  return message.slice(idx + prefix.length).trim().replace(/^["']|["']$/g, '');
}

export async function orchestrateMessage(
  message: string,
  conversationId?: string,
): Promise<OrchestratorResult> {
  const command = detectCommand(message);
  const def = getCommandDefinition(command);
  const service = def?.service ?? 'lateen-assistant';

  const trace = recordTrace({
    conversationId,
    service,
    action: command,
  });

  try {
    const result = await executeCommand(command, message);
    return { ...result, traceId: trace.traceId };
  } catch (error) {
    return {
      markdown: `**Error orchestrating command**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n_No business logic runs in Lateen Assistant — errors originate from downstream services._`,
      command,
      service,
      traceId: trace.traceId,
    };
  }
}

async function executeCommand(command: AssistantCommand, message: string): Promise<Omit<OrchestratorResult, 'traceId'>> {
  switch (command) {
    case 'help':
      return {
        command,
        service: 'lateen-assistant',
        markdown: formatHelp(),
      };

    case 'create-customer': {
      const name = extractArg(message, 'create customer') || 'New Customer';
      const created = await createCustomer({ name });
      return {
        command,
        service: 'business-dna-service',
        markdown: `✅ **Customer created** via Business DNA Service\n\n- **ID:** \`${String(created.id ?? 'pending')}\`\n- **Name:** ${name}`,
        table: { title: 'Customer', headers: ['Field', 'Value'], rows: [['Name', name], ['Status', 'active']] },
      };
    }

    case 'create-quotation': {
      const title = extractArg(message, 'create quotation') || 'New Quotation';
      const created = await createQuotation({ title });
      return {
        command,
        service: 'business-dna-service',
        markdown: `✅ **Quotation created**\n\n- **Title:** ${title}\n- **ID:** \`${String(created.id ?? 'pending')}\``,
      };
    }

    case 'create-project': {
      const name = extractArg(message, 'create project') || 'New Project';
      const created = await createProject({ name });
      return {
        command,
        service: 'business-dna-service',
        markdown: `✅ **Project created**\n\n- **Name:** ${name}\n- **ID:** \`${String(created.id ?? 'pending')}\``,
      };
    }

    case 'launch-product': {
      const title = extractArg(message, 'launch product') || 'New Product Opportunity';
      const mission = await startMission({ opportunityTitle: title, scenario: 'happy_path' });
      const progress = mission.stages.filter((s) => s.status === 'completed').length;
      const pct = Math.round((progress / mission.stages.length) * 100);
      return {
        command,
        service: 'ai-product-manager',
        markdown: `🚀 **Product launch mission started**\n\n- **Mission:** ${mission.title}\n- **Status:** ${mission.status}\n- **Progress:** ${pct}%`,
        correlation: { missionId: mission.id },
      };
    }

    case 'run-product-discovery': {
      const keywords = extractArg(message, 'run product discovery')
        .split(/[,;\s]+/)
        .filter(Boolean)
        .slice(0, 5);
      const kw = keywords.length ? keywords : ['trending', 'market'];
      const run = await runDiscovery(kw);
      return {
        command,
        service: 'product-discovery',
        markdown: `🔍 **Product discovery run started**\n\n- **Keywords:** ${kw.join(', ')}\n- **Run ID:** \`${String(run.id ?? 'pending')}\``,
      };
    }

    case 'approve-decision': {
      const decisions = await fetchDecisions();
      const pending = decisions.find((d) => d.status === 'pending' || d.status === 'submitted');
      if (!pending) {
        return { command, service: 'ai-product-manager', markdown: 'No pending decisions found to approve.' };
      }
      const approved = await approveDecision(String(pending.recommendationId ?? pending.id));
      return {
        command,
        service: 'ai-product-manager',
        markdown: `✅ **Decision approved**\n\n- **Title:** ${String(pending.title ?? approved.title ?? 'Decision')}\n- **Status:** approved`,
        correlation: { decisionId: String(pending.id ?? pending.recommendationId) },
      };
    }

    case 'assign-ai-worker': {
      const agents = await listAgents();
      return {
        command,
        service: 'business-dna-service',
        markdown: `🤖 **AI Workforce** (${agents.length} agents registered in Business DNA)\n\nAssign workers via Business DNA Studio or Workflow Engine.`,
        table: {
          title: 'AI Agents',
          headers: ['Name', 'Role', 'Status'],
          rows: agents.slice(0, 8).map((a) => [a.name ?? a.id, a.workforceType ?? 'agent', a.status ?? 'active']),
        },
      };
    }

    case 'start-workflow': {
      const workflows = await listWorkflows();
      return {
        command,
        service: 'business-dna-service',
        markdown: `⚙️ **Workflows** (${workflows.length} definitions in Business DNA)\n\nUse Workflow Console to pause, resume, or cancel running instances.`,
        table: {
          title: 'Workflow Definitions',
          headers: ['Name', 'Status'],
          rows: workflows.slice(0, 8).map((w) => [String(w.name ?? w.id), String(w.status ?? 'active')]),
        },
        correlation: workflows[0] ? { workflowId: String(workflows[0].id) } : undefined,
      };
    }

    case 'show-company-health': {
      const [org, counts, platform, discovery] = await Promise.all([
        getOrganization(),
        fetchEntityCounts(),
        fetchPlatformHealth(),
        getPlatformHealth(),
      ]);
      return {
        command,
        service: 'ceo-cockpit',
        markdown: `## Company Health\n\n**Organization:** ${org?.name ?? 'Lateen OS'}\n\n| Metric | Count |\n|--------|-------|\n| Customers | ${counts.customers} |\n| Projects | ${counts.projects} |\n| Workflows | ${counts.workflows} |\n| AI Agents | ${counts.agents} |\n| Products | ${counts.products} |\n\n**Platform:** ${String((platform as { status?: string })?.status ?? 'unknown')} · **Discovery:** ${String((discovery as { status?: string })?.status ?? 'unknown')}`,
        chart: {
          type: 'bar',
          title: 'Entity Counts',
          data: [
            { name: 'Customers', value: counts.customers },
            { name: 'Projects', value: counts.projects },
            { name: 'Agents', value: counts.agents },
            { name: 'Products', value: counts.products },
          ],
        },
      };
    }

    case 'show-ceo-dashboard': {
      const dashboard = await fetchExecutiveDashboard();
      const summary = dashboard as { missionSummary?: Record<string, number>; counts?: Record<string, number> } | null;
      const ms = summary?.missionSummary ?? {};
      return {
        command,
        service: 'ceo-cockpit',
        markdown: `## CEO Dashboard Summary\n\n| Missions | Value |\n|----------|-------|\n| Active | ${ms.activeMissions ?? 0} |\n| Completed | ${ms.completedMissions ?? 0} |\n| Failed | ${ms.failedMissions ?? 0} |\n| Escalated | ${ms.escalatedMissions ?? 0} |\n\n_Full dashboard available in CEO Cockpit._`,
        chart: {
          type: 'bar',
          title: 'Mission Summary',
          data: [
            { name: 'Active', value: ms.activeMissions ?? 0 },
            { name: 'Completed', value: ms.completedMissions ?? 0 },
            { name: 'Failed', value: ms.failedMissions ?? 0 },
          ],
        },
      };
    }

    case 'search-institutional-memory': {
      const query = extractArg(message, 'search institutional memory') || extractArg(message, 'search memory');
      const entries = await buildMemoryEntries();
      const filtered = query
        ? entries.filter((e) => e.title.toLowerCase().includes(query.toLowerCase()) || e.summary.toLowerCase().includes(query.toLowerCase()))
        : entries;
      return {
        command,
        service: 'ceo-cockpit',
        markdown: `## Institutional Memory\n\nFound **${filtered.length}** entries${query ? ` matching "${query}"` : ''}.`,
        table: {
          title: 'Memory Entries',
          headers: ['Category', 'Title', 'Source'],
          rows: filtered.slice(0, 10).map((e) => [e.category, e.title, e.source]),
        },
      };
    }

    case 'explain-decisions': {
      const decisions = await fetchDecisions();
      return {
        command,
        service: 'ai-product-manager',
        markdown: `## Decision Explorer\n\n**${decisions.length}** decisions from AI Product Manager / Discovery pipeline.`,
        table: {
          title: 'Decisions',
          headers: ['Title', 'Status', 'Confidence', 'Risk'],
          rows: decisions.slice(0, 10).map((d) => [
            String(d.title ?? d.id),
            String(d.status ?? 'pending'),
            String(d.confidence ?? '—'),
            String(d.risk ?? '—'),
          ]),
        },
      };
    }

    case 'generate-report': {
      const [org, counts, missions, decisions, connectors] = await Promise.all([
        getOrganization(),
        fetchEntityCounts(),
        fetchMissions(),
        fetchDecisions(),
        listConnectors(),
      ]);
      return {
        command,
        service: 'lateen-assistant',
        markdown: `# Executive Report — ${org?.name ?? 'Lateen OS'}\n\nGenerated ${new Date().toISOString()}\n\n## Overview\n- **Missions:** ${missions.length}\n- **Decisions:** ${decisions.length}\n- **Connectors:** ${connectors.length}\n- **Customers:** ${counts.customers}\n\n## Code: Mission Status Distribution\n\n\`\`\`json\n${JSON.stringify(missions.map((m) => ({ id: m.id, status: m.status })), null, 2)}\n\`\`\``,
        code: JSON.stringify({ counts, missionCount: missions.length, missions: missions.map((m) => ({ id: m.id, status: m.status })) }, null, 2),
      };
    }

    default:
      return {
        command: 'unknown',
        service: 'lateen-assistant',
        markdown: `I'm **Lateen Assistant** — your unified interface to Lateen OS.\n\nTry a slash command:\n${COMMAND_CATALOG.slice(0, 6).map((c) => `- \`${c.slash}\` — ${c.description}`).join('\n')}\n\nOr type \`/help\` for all commands.`,
      };
  }
}

function formatHelp(): string {
  return `## Available Commands\n\n${COMMAND_CATALOG.map((c) => `- **${c.slash}** — ${c.description} _(${c.service})_`).join('\n')}`;
}

export async function buildMemoryEntries(): Promise<MemoryEntry[]> {
  const [cockpitMemory, missions, decisions, policies, products, recommendations] = await Promise.all([
    fetchCockpitMemory().catch(() => []),
    fetchMissions(),
    fetchDecisions(),
    listPolicies(),
    listProducts(),
    listRecommendations(),
  ]);

  const entries: MemoryEntry[] = [];

  for (const m of Array.isArray(cockpitMemory) ? cockpitMemory : []) {
    const item = m as { id?: string; title?: string; summary?: string; category?: string; occurredAt?: string };
    entries.push({
      id: String(item.id ?? randomUUID()),
      category: (item.category as MemoryEntry['category']) ?? 'document',
      title: String(item.title ?? 'Memory entry'),
      summary: String(item.summary ?? ''),
      source: 'ceo-cockpit',
      occurredAt: String(item.occurredAt ?? new Date().toISOString()),
    });
  }

  for (const mission of missions) {
    entries.push({
      id: mission.id,
      category: 'playbook',
      title: `Mission: ${mission.title}`,
      summary: `Status ${mission.status}, stage ${mission.currentStage}`,
      source: 'ai-product-manager',
      occurredAt: mission.completedAt ?? mission.startedAt,
    });
  }

  for (const d of decisions) {
    entries.push({
      id: String(d.id ?? d.recommendationId),
      category: 'lesson',
      title: String(d.title ?? 'Decision'),
      summary: `Status: ${String(d.status)}, confidence: ${String(d.confidence ?? '—')}`,
      source: 'decision-engine',
      occurredAt: String(d.updatedAt ?? new Date().toISOString()),
    });
  }

  for (const p of policies) {
    entries.push({
      id: String(p.id),
      category: 'policy',
      title: String(p.name ?? p.title ?? 'Policy'),
      summary: String(p.description ?? 'Organizational policy'),
      source: 'business-dna',
      occurredAt: String(p.updatedAt ?? new Date().toISOString()),
    });
  }

  for (const r of recommendations) {
    const rec = r as { id?: string; recommendationCandidate?: { title?: string }; updatedAt?: string };
    entries.push({
      id: String(rec.id),
      category: 'research',
      title: String(rec.recommendationCandidate?.title ?? 'Discovery recommendation'),
      summary: 'Product discovery research output',
      source: 'product-discovery',
      occurredAt: String(rec.updatedAt ?? new Date().toISOString()),
    });
  }

  return entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export async function searchAll(query: string) {
  const q = query.toLowerCase();
  const [memory, missions, decisions, projects, workflows] = await Promise.all([
    buildMemoryEntries(),
    fetchMissions(),
    fetchDecisions(),
    listProjects(),
    listWorkflows(),
  ]);

  const results = [];

  for (const m of memory.filter((e) => e.title.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q))) {
    results.push({ type: 'memory' as const, id: m.id, title: m.title, snippet: m.summary, source: m.source });
  }
  for (const m of missions.filter((m) => m.title.toLowerCase().includes(q))) {
    results.push({ type: 'mission' as const, id: m.id, title: m.title, snippet: m.status, source: 'ai-product-manager' });
  }
  for (const d of decisions.filter((d) => String(d.title ?? '').toLowerCase().includes(q))) {
    results.push({ type: 'decision' as const, id: String(d.id), title: String(d.title), snippet: String(d.status), source: 'ai-product-manager' });
  }
  for (const p of projects.filter((p) => String(p.name ?? '').toLowerCase().includes(q))) {
    results.push({ type: 'knowledge' as const, id: String(p.id), title: String(p.name), snippet: String(p.status ?? ''), source: 'business-dna' });
  }
  for (const w of workflows.filter((w) => String(w.name ?? '').toLowerCase().includes(q))) {
    results.push({ type: 'workflow' as const, id: String(w.id), title: String(w.name), snippet: String(w.status ?? ''), source: 'business-dna' });
  }

  return results.slice(0, 30);
}
