/** @module nodes/policy */
import type { PolicyId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type PolicyNodeType = 'policy';

/** Graph node representing a Policy aggregate. */
export interface PolicyGraphNode extends TypedGraphNode<'policy', PolicyId> {}

export const policyNodeDefinition: GraphNodeDefinition<'policy'> = {
  nodeType: 'policy',
  description: 'Organizational policy governing compliance or operations.',
};
