/** @module entities/types */
import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { GraphNodeType } from '../nodes/node-type.js';
import type { GraphLabel, GraphProperties } from '../shared/primitives.js';

export interface RegisterEntityInput {
  readonly nodeType: GraphNodeType;
  readonly entityId: Identifier;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}

export interface UpdateEntityInput {
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}
