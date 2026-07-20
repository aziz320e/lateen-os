/**
 * Canonical relationship type identifiers for the domain graph.
 *
 * @module relationships/relationship-type
 */

/** All supported semantic relationship types in the Lateen OS domain graph. */
export type RelationshipType =
  | 'BELONGS_TO'
  | 'OWNS'
  | 'PROVIDES'
  | 'REQUIRES'
  | 'USES'
  | 'PRODUCES'
  | 'ASSIGNED_TO'
  | 'REPORTS_TO'
  | 'MANAGED_BY'
  | 'SUPPLIES'
  | 'PURCHASED_BY'
  | 'GENERATED_FROM'
  | 'DEPENDS_ON'
  | 'LOCATED_AT'
  | 'CREATED_BY'
  | 'UPDATED_BY'
  | 'RELATED_TO';

/** Runtime-constant list of all relationship types. */
export const RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'BELONGS_TO',
  'OWNS',
  'PROVIDES',
  'REQUIRES',
  'USES',
  'PRODUCES',
  'ASSIGNED_TO',
  'REPORTS_TO',
  'MANAGED_BY',
  'SUPPLIES',
  'PURCHASED_BY',
  'GENERATED_FROM',
  'DEPENDS_ON',
  'LOCATED_AT',
  'CREATED_BY',
  'UPDATED_BY',
  'RELATED_TO',
] as const;

/** Human-readable description of a relationship type. */
export interface RelationshipTypeDefinition {
  readonly type: RelationshipType;
  readonly description: string;
  readonly directed: boolean;
}

/** Canonical metadata for each relationship type. */
export const RELATIONSHIP_TYPE_DEFINITIONS: Readonly<Record<RelationshipType, RelationshipTypeDefinition>> = {
  BELONGS_TO: {
    type: 'BELONGS_TO',
    description: 'Child entity belongs to a parent organizational entity.',
    directed: true,
  },
  OWNS: {
    type: 'OWNS',
    description: 'Entity owns or holds another entity.',
    directed: true,
  },
  PROVIDES: {
    type: 'PROVIDES',
    description: 'Source entity provides a capability or resource to the target.',
    directed: true,
  },
  REQUIRES: {
    type: 'REQUIRES',
    description: 'Source entity requires the target to operate or be produced.',
    directed: true,
  },
  USES: {
    type: 'USES',
    description: 'Source entity uses the target during execution or delivery.',
    directed: true,
  },
  PRODUCES: {
    type: 'PRODUCES',
    description: 'Source entity produces or outputs the target entity.',
    directed: true,
  },
  ASSIGNED_TO: {
    type: 'ASSIGNED_TO',
    description: 'Actor or resource is assigned to a target entity or role context.',
    directed: true,
  },
  REPORTS_TO: {
    type: 'REPORTS_TO',
    description: 'Employee reports to another employee in the hierarchy.',
    directed: true,
  },
  MANAGED_BY: {
    type: 'MANAGED_BY',
    description: 'Entity is managed or supervised by another entity.',
    directed: true,
  },
  SUPPLIES: {
    type: 'SUPPLIES',
    description: 'Supplier provides materials or goods to the target.',
    directed: true,
  },
  PURCHASED_BY: {
    type: 'PURCHASED_BY',
    description: 'Commercial document or order is purchased by a customer.',
    directed: true,
  },
  GENERATED_FROM: {
    type: 'GENERATED_FROM',
    description: 'Entity was generated or derived from a source entity.',
    directed: true,
  },
  DEPENDS_ON: {
    type: 'DEPENDS_ON',
    description: 'Entity has a dependency on another entity.',
    directed: true,
  },
  LOCATED_AT: {
    type: 'LOCATED_AT',
    description: 'Physical or logical entity is located at a site or branch.',
    directed: true,
  },
  CREATED_BY: {
    type: 'CREATED_BY',
    description: 'Entity was created by an actor (employee or AI agent).',
    directed: true,
  },
  UPDATED_BY: {
    type: 'UPDATED_BY',
    description: 'Entity was last updated by an actor.',
    directed: true,
  },
  RELATED_TO: {
    type: 'RELATED_TO',
    description: 'Generic semantic association when no specific type applies.',
    directed: false,
  },
};
