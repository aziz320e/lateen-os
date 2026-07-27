/** @module nodes/document */
import type { DocumentId } from '../shared/identifiers.js';
import type { GraphNodeDefinition, TypedGraphNode } from './types.js';

export type DocumentNodeType = 'document';

/** Graph node representing an external or internal document reference. */
export interface DocumentGraphNode extends TypedGraphNode<'document', DocumentId> {}

export const documentNodeDefinition: GraphNodeDefinition<'document'> = {
  nodeType: 'document',
  description: 'External or internal document linked to one or more entities.',
};
