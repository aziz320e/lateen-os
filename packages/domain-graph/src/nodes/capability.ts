/** @module nodes/capability */
import type { CapabilityId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type CapabilityNodeType = 'capability';

/** Graph node representing a Capability from the Capability Engine. */
export interface CapabilityGraphNode extends TypedGraphNode<'capability', CapabilityId> {}

export const capabilityNodeDefinition: GraphNodeDefinition<'capability'> = {
  nodeType: 'capability',
  description: 'Abstract production capability independent of specific machines.',
};
