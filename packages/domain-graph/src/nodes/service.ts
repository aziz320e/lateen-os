/** @module nodes/service */
import type { ServiceId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type ServiceNodeType = 'service';

/** Graph node representing a Service aggregate. */
export interface ServiceGraphNode extends TypedGraphNode<'service', ServiceId> {}

export const serviceNodeDefinition: GraphNodeDefinition<'service'> = {
  nodeType: 'service',
  description: 'Service offering delivered by the organization.',
};
