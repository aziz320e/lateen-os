/** @module nodes/mission */
import type { MissionId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type MissionNodeType = 'mission';

/** Graph node representing a multi-agent collaboration mission. */
export interface MissionGraphNode extends TypedGraphNode<'mission', MissionId> {}

export const missionNodeDefinition: GraphNodeDefinition<'mission'> = {
  nodeType: 'mission',
  description: 'Multi-agent collaboration mission aligned to a business objective.',
};
