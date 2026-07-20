/** @module nodes/ai-agent */
import type { AgentId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type AiAgentNodeType = 'ai_agent';

/** Graph node representing an AI Agent aggregate from Business DNA. */
export interface AiAgentGraphNode extends TypedGraphNode<'ai_agent', AgentId> {}

export const aiAgentNodeDefinition: GraphNodeDefinition<'ai_agent'> = {
  nodeType: 'ai_agent',
  description: 'Registered AI workforce agent operating in reactive and proactive modes.',
};
