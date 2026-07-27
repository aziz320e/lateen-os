/** @module nodes/knowledge */
import type { KnowledgeId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type KnowledgeNodeType = 'knowledge';

/** Graph node representing an institutional memory knowledge entry. */
export interface KnowledgeGraphNode extends TypedGraphNode<'knowledge', KnowledgeId> {}

export const knowledgeNodeDefinition: GraphNodeDefinition<'knowledge'> = {
  nodeType: 'knowledge',
  description: 'Curated institutional knowledge artifact (policy, SOP, lesson, etc.).',
};
