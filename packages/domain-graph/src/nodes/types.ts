/**
 * Typed graph node foundation.
 *
 * @module nodes/types
 */

import type { Identifier } from '@lateen-os/shared-kernel/identity';
import type { OrganizationId } from '../shared/identifiers.js';
import type { GraphLabel, GraphProperties } from '../shared/primitives.js';
import type { GraphNode } from '../graph/types.js';
import type { GraphNodeType } from './node-type.js';

/** Definition metadata for a graph node type (schema-level, not an instance). */
export interface GraphNodeDefinition<TType extends GraphNodeType> {
  readonly nodeType: TType;
  readonly description: string;
}

/** Typed graph node with a specific entity identifier. */
export interface TypedGraphNode<
  TType extends GraphNodeType,
  TEntityId extends Identifier = Identifier,
> extends GraphNode<TType> {
  readonly entityId: TEntityId;
  readonly organizationId: OrganizationId;
  readonly label?: GraphLabel;
  readonly properties?: GraphProperties;
}
