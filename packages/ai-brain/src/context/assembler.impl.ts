/**
 * Real enterprise context assembly — deterministic. Optionally enriches
 * mission-like context with pending approvals from
 * `@lateen-os/decision-engine` (the one business-context dependency with a
 * real, callable query implementation today); business-dna, domain-graph,
 * and institutional-memory are contracts-only, so their reference lists
 * stay empty until those packages ship real implementations to query.
 *
 * @module context/assembler.impl
 */
import type { DecisionQueries } from '@lateen-os/decision-engine';
import { generateId, nowIso } from '../shared/id.js';
import type { ContextAssemblyInput, EnterpriseContextAssembler } from './assembler.js';
import type { BusinessContext, ConversationContext, EnterpriseContext, MissionContext } from './types.js';

const MISSION_LIKE_INTENTS: ReadonlySet<string> = new Set(['mission', 'collaboration']);
const CONVERSATION_HISTORY_WINDOW = 5;

export interface EnterpriseContextAssemblerDeps {
  readonly decisionQueries?: DecisionQueries;
}

/** Creates a deterministic {@link EnterpriseContextAssembler}. */
export function createEnterpriseContextAssembler(
  deps: EnterpriseContextAssemblerDeps = {},
): EnterpriseContextAssembler {
  return {
    async assemble(input: ContextAssemblyInput): Promise<EnterpriseContext> {
      const history = input.conversationHistory ?? [];

      const business: BusinessContext = {
        organizationId: input.organizationId,
        entityReferences: input.intent.entities.map((entity) => entity.value),
        policyReferences: [],
        kpiReferences: [],
      };

      const conversation: ConversationContext = {
        id: generateId('conversation-context'),
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        correlationId: input.correlationId,
        turnCount: history.length + 1,
        recentMessages: [...history.slice(-CONVERSATION_HISTORY_WINDOW), input.intent.rawInput],
        activeIntentSummary: input.intent.summary,
      };

      let mission: MissionContext | undefined;
      if (MISSION_LIKE_INTENTS.has(input.intent.type)) {
        const relatedDecisionIds = deps.decisionQueries
          ? (await deps.decisionQueries.findPendingApprovals({ organizationId: input.organizationId })).flows.map(
              (flow) => flow.decisionId,
            )
          : [];
        mission = {
          missionType: input.intent.type,
          objectiveSummary: input.intent.summary,
          relatedDecisionIds,
        };
      }

      return {
        id: generateId('enterprise-context'),
        organizationId: input.organizationId,
        correlationId: input.correlationId,
        business,
        conversation,
        mission,
        graphNodeIds: [],
        knowledgeEntryIds: [],
        assembledAt: nowIso(),
      };
    },
  };
}
