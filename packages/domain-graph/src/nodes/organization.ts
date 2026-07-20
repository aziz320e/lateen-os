/** @module nodes/organization */
import type { OrganizationId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type OrganizationNodeType = 'organization';

/** Graph node representing an Organization aggregate. */
export interface OrganizationGraphNode extends TypedGraphNode<'organization', OrganizationId> {}

export const organizationNodeDefinition: GraphNodeDefinition<'organization'> = {
  nodeType: 'organization',
  description: 'Tenant root — the canonical organization entity in Business DNA.',
};
