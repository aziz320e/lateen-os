/**
 * Real working-memory retrieval — deterministic and offline. No
 * institutional-memory or domain-graph implementation exists yet to query,
 * so retrieval is grounded entirely in what the current intent/context
 * already carry.
 *
 * @module memory/working-memory.impl
 */
import { generateId } from '../shared/id.js';
import type { WorkingMemory, WorkingMemoryInput } from './working-memory.js';
import type { WorkingContext } from './types.js';

/** Creates a deterministic {@link WorkingMemory}. */
export function createWorkingMemory(): WorkingMemory {
  return {
    async retrieve(input: WorkingMemoryInput): Promise<WorkingContext> {
      const notes: string[] = [];
      if (input.query) notes.push(`Query: ${input.query}`);
      notes.push(
        `Assembled from ${input.context.knowledgeEntryIds.length} knowledge reference(s) and ${input.context.graphNodeIds.length} graph node reference(s).`,
      );

      return {
        id: generateId('working-context'),
        organizationId: input.organizationId,
        sessionId: input.sessionId,
        retrievedKnowledge: [],
        relevantEntities: {
          projectIds: input.context.business.projectId ? [input.context.business.projectId] : [],
          customerIds: [],
          productIds: [],
          employeeIds: [],
          graphNodeIds: input.context.graphNodeIds,
        },
        activeHypotheses: [`Likely intent: ${input.intent.type} (${input.intent.confidence.level} confidence)`],
        notes,
      };
    },
  };
}
