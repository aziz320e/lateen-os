/** @module nodes/asset */
import type { AssetId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type AssetNodeType = 'asset';

/** Graph node representing an Asset aggregate. */
export interface AssetGraphNode extends TypedGraphNode<'asset', AssetId> {}

export const assetNodeDefinition: GraphNodeDefinition<'asset'> = {
  nodeType: 'asset',
  description: 'Physical or digital asset owned by the organization.',
};
