/** @module nodes/branch */
import type { BranchId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type BranchNodeType = 'branch';

/** Graph node representing a Branch aggregate. */
export interface BranchGraphNode extends TypedGraphNode<'branch', BranchId> {}

export const branchNodeDefinition: GraphNodeDefinition<'branch'> = {
  nodeType: 'branch',
  description: 'Organizational branch location within an organization.',
};
