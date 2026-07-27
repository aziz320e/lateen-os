/** @module validation/types */
import type { GraphNode } from '../graph/types.js';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { GraphEdgeId, GraphNodeId } from '../shared/identifiers.js';

export interface DuplicateEntityGroup {
  readonly nodeType: GraphNodeType;
  readonly entityId: string;
  readonly nodeIds: readonly GraphNodeId[];
}

export interface DanglingRelationshipReport {
  readonly relationshipId: GraphEdgeId;
  readonly missingRole: 'source' | 'target';
  readonly missingNodeId: GraphNodeId;
}

export interface GraphValidationReport {
  readonly duplicateEntities: readonly DuplicateEntityGroup[];
  readonly danglingRelationships: readonly DanglingRelationshipReport[];
  readonly orphanEntities: readonly GraphNode[];
  readonly cycles: readonly (readonly GraphNodeId[])[];
  readonly isValid: boolean;
}
