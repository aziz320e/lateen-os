/** @module nodes/campaign */
import type { CampaignId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type CampaignNodeType = 'campaign';

/** Graph node representing a marketing or sales campaign. */
export interface CampaignGraphNode extends TypedGraphNode<'campaign', CampaignId> {}

export const campaignNodeDefinition: GraphNodeDefinition<'campaign'> = {
  nodeType: 'campaign',
  description: 'Marketing or sales campaign.',
};
