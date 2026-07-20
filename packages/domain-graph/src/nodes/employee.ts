/** @module nodes/employee */
import type { EmployeeId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type EmployeeNodeType = 'employee';

/** Graph node representing an Employee aggregate. */
export interface EmployeeGraphNode extends TypedGraphNode<'employee', EmployeeId> {}

export const employeeNodeDefinition: GraphNodeDefinition<'employee'> = {
  nodeType: 'employee',
  description: 'Human worker employed by the organization.',
};
