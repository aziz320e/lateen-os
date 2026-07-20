/** @module nodes/project */
import type { ProjectId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type ProjectNodeType = 'project';

/** Graph node representing a Project aggregate. */
export interface ProjectGraphNode extends TypedGraphNode<'project', ProjectId> {}

export const projectNodeDefinition: GraphNodeDefinition<'project'> = {
  nodeType: 'project',
  description: 'Customer project — signage, branding, rollouts, or installations.',
};
