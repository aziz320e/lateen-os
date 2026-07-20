/** @module nodes/workflow */
import type { WorkflowId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type WorkflowNodeType = 'workflow';

/** Graph node representing a Workflow aggregate. */
export interface WorkflowGraphNode extends TypedGraphNode<'workflow', WorkflowId> {}

export const workflowNodeDefinition: GraphNodeDefinition<'workflow'> = {
  nodeType: 'workflow',
  description: 'Business process workflow definition.',
};
