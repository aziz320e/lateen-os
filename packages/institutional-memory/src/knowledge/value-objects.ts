/** @module knowledge/value-objects */
import type { KnowledgeEntryId } from '../shared/identifiers.js';
import type { KnowledgeType } from './types.js';

/** Typed knowledge classification label. */
export interface KnowledgeTypeLabel {
  readonly type: KnowledgeType;
  readonly displayName: string;
}

export type KnowledgeRelationshipType = 'related' | 'parent_child' | 'reference';

/** A single directed or undirected edge in the knowledge relationship graph. */
export interface KnowledgeRelationshipEdge {
  readonly fromKnowledgeEntryId: KnowledgeEntryId;
  readonly toKnowledgeEntryId: KnowledgeEntryId;
  readonly relationshipType: KnowledgeRelationshipType;
}
