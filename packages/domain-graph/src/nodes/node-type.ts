/**
 * Canonical graph node type identifiers.
 *
 * Each value maps to a Business DNA aggregate (or Capability) in the semantic graph.
 *
 * @module nodes/node-type
 */

/** All supported node types in the Lateen OS domain graph. */
export type GraphNodeType =
  | 'organization'
  | 'branch'
  | 'department'
  | 'employee'
  | 'customer'
  | 'supplier'
  | 'machine'
  | 'capability'
  | 'product'
  | 'service'
  | 'project'
  | 'workflow'
  | 'policy'
  | 'asset'
  | 'quotation'
  | 'order'
  | 'invoice'
  | 'ai_agent'
  | 'kpi';

/** Runtime-constant list of all graph node types. */
export const GRAPH_NODE_TYPES: readonly GraphNodeType[] = [
  'organization',
  'branch',
  'department',
  'employee',
  'customer',
  'supplier',
  'machine',
  'capability',
  'product',
  'service',
  'project',
  'workflow',
  'policy',
  'asset',
  'quotation',
  'order',
  'invoice',
  'ai_agent',
  'kpi',
] as const;
