/** @module nodes/department */
import type { DepartmentId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type DepartmentNodeType = 'department';

/** Graph node representing a Department aggregate. */
export interface DepartmentGraphNode extends TypedGraphNode<'department', DepartmentId> {}

export const departmentNodeDefinition: GraphNodeDefinition<'department'> = {
  nodeType: 'department',
  description: 'Organizational department within an organization or branch.',
};
