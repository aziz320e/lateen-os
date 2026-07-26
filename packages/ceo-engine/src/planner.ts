/**
 * Planner — deterministically decomposes a {@link Mission} into one or more
 * {@link AgentTask}s by matching its title/description against each
 * executive agent's keyword vocabulary. Falls back to "operations" when no
 * agent matches, so planning always produces at least one task.
 *
 * @module planner
 */
import type { AgentId, AgentTask, Mission } from './types.js';

const AGENT_KEYWORDS: Readonly<Record<AgentId, readonly string[]>> = {
  seo: ['seo', 'search ranking', 'keyword', 'backlink', 'organic traffic'],
  marketing: ['marketing', 'campaign', 'brand', 'advertising', 'social media'],
  sales: ['sales', 'pipeline', 'lead', 'deal', 'quota', 'customer acquisition'],
  product: ['product', 'feature', 'roadmap', 'release', 'user experience'],
  operations: ['operations', 'logistics', 'supply chain', 'process', 'fulfillment'],
  finance: ['finance', 'budget', 'revenue', 'invoice', 'cost', 'forecast'],
};

const DEFAULT_AGENT: AgentId = 'operations';

function matchAgents(text: string): readonly AgentId[] {
  const normalized = text.toLowerCase();
  const matches = (Object.keys(AGENT_KEYWORDS) as AgentId[]).filter((agent) =>
    AGENT_KEYWORDS[agent].some((keyword) => normalized.includes(keyword)),
  );
  return matches.length > 0 ? matches : [DEFAULT_AGENT];
}

export interface Planner {
  /** Produces the ordered list of agent tasks a mission should be dispatched as. */
  plan(mission: Mission): readonly AgentTask[];
}

/** Creates a deterministic, offline {@link Planner}. */
export function createPlanner(): Planner {
  return {
    plan(mission) {
      const agents = matchAgents(`${mission.title} ${mission.description}`);
      return agents.map((agent) => ({
        agent,
        missionId: mission.id,
        instruction: mission.description || mission.title,
      }));
    },
  };
}
