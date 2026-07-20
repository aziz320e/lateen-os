/** @module nodes/machine */
import type { MachineId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type MachineNodeType = 'machine';

/** Graph node representing a Machine aggregate. */
export interface MachineGraphNode extends TypedGraphNode<'machine', MachineId> {}

export const machineNodeDefinition: GraphNodeDefinition<'machine'> = {
  nodeType: 'machine',
  description: 'Production machine or equipment from Business DNA.',
};
