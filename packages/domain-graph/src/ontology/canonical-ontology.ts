/**
 * Canonical ontology triples for the Lateen OS domain graph.
 *
 * @module ontology/canonical-ontology
 */

import type { OntologySemanticAlias, OntologyTriple } from './types.js';

/** All allowed semantic triples in the canonical ontology. */
export const CANONICAL_ONTOLOGY: readonly OntologyTriple[] = [
  // Organizational hierarchy
  {
    source: 'branch',
    relationship: 'BELONGS_TO',
    target: 'organization',
    description: 'Branch belongs to organization.',
  },
  {
    source: 'department',
    relationship: 'BELONGS_TO',
    target: 'organization',
    description: 'Department belongs to organization.',
  },
  {
    source: 'department',
    relationship: 'BELONGS_TO',
    target: 'branch',
    description: 'Department may belong to a branch.',
  },
  {
    source: 'employee',
    relationship: 'BELONGS_TO',
    target: 'department',
    description: 'Employee belongs to a department.',
  },
  {
    source: 'employee',
    relationship: 'BELONGS_TO',
    target: 'branch',
    description: 'Employee may be assigned to a branch.',
  },
  {
    source: 'employee',
    relationship: 'REPORTS_TO',
    target: 'employee',
    description: 'Employee reports to another employee.',
  },
  {
    source: 'machine',
    relationship: 'BELONGS_TO',
    target: 'branch',
    description: 'Machine is located at a branch.',
  },
  {
    source: 'machine',
    relationship: 'BELONGS_TO',
    target: 'department',
    description: 'Machine is owned by a department.',
  },
  {
    source: 'asset',
    relationship: 'BELONGS_TO',
    target: 'organization',
    description: 'Asset belongs to organization.',
  },
  {
    source: 'ai_agent',
    relationship: 'BELONGS_TO',
    target: 'department',
    description: 'AI agent belongs to a department.',
  },
  {
    source: 'ai_agent',
    relationship: 'MANAGED_BY',
    target: 'employee',
    description: 'AI agent is supervised by an employee.',
  },

  // Capability graph
  {
    source: 'machine',
    relationship: 'PROVIDES',
    target: 'capability',
    description: 'Machine provides a production capability.',
  },
  {
    source: 'product',
    relationship: 'REQUIRES',
    target: 'capability',
    description: 'Product requires a capability to be produced.',
  },
  {
    source: 'service',
    relationship: 'REQUIRES',
    target: 'capability',
    description: 'Service requires a capability during delivery.',
  },
  {
    source: 'machine',
    relationship: 'PRODUCES',
    target: 'product',
    description: 'Machine produces a product.',
  },

  // Customer and commercial
  {
    source: 'customer',
    relationship: 'OWNS',
    target: 'project',
    description: 'Customer owns a project.',
  },
  {
    source: 'project',
    relationship: 'USES',
    target: 'machine',
    description: 'Project uses machines during delivery.',
  },
  {
    source: 'project',
    relationship: 'USES',
    target: 'product',
    description: 'Project uses products.',
  },
  {
    source: 'project',
    relationship: 'USES',
    target: 'service',
    description: 'Project consumes services.',
  },
  {
    source: 'quotation',
    relationship: 'PURCHASED_BY',
    target: 'customer',
    description: 'Quotation is for a customer.',
  },
  {
    source: 'order',
    relationship: 'PURCHASED_BY',
    target: 'customer',
    description: 'Order is placed by a customer.',
  },
  {
    source: 'order',
    relationship: 'GENERATED_FROM',
    target: 'quotation',
    description: 'Order generated from a quotation.',
  },
  {
    source: 'invoice',
    relationship: 'GENERATED_FROM',
    target: 'order',
    description: 'Invoice generated from an order.',
  },
  {
    source: 'order',
    relationship: 'REQUIRES',
    target: 'product',
    description: 'Order line requires products.',
  },
  {
    source: 'order',
    relationship: 'REQUIRES',
    target: 'service',
    description: 'Order line requires services.',
  },

  // Supply chain
  {
    source: 'supplier',
    relationship: 'SUPPLIES',
    target: 'product',
    description: 'Supplier supplies products or materials.',
  },
  {
    source: 'product',
    relationship: 'DEPENDS_ON',
    target: 'supplier',
    description: 'Product depends on a supplier.',
  },

  // Workflow and policy
  {
    source: 'workflow',
    relationship: 'DEPENDS_ON',
    target: 'policy',
    description: 'Workflow depends on a governing policy.',
  },
  {
    source: 'workflow',
    relationship: 'ASSIGNED_TO',
    target: 'employee',
    description: 'Workflow stage assigned to employee role holder.',
  },
  {
    source: 'workflow',
    relationship: 'ASSIGNED_TO',
    target: 'ai_agent',
    description: 'Workflow stage assigned to AI agent.',
  },
  {
    source: 'policy',
    relationship: 'BELONGS_TO',
    target: 'organization',
    description: 'Policy belongs to organization.',
  },
  {
    source: 'kpi',
    relationship: 'BELONGS_TO',
    target: 'organization',
    description: 'KPI belongs to organization.',
  },
  {
    source: 'kpi',
    relationship: 'DEPENDS_ON',
    target: 'product',
    description: 'KPI may track product metrics.',
  },

  // Location and provenance
  {
    source: 'project',
    relationship: 'LOCATED_AT',
    target: 'branch',
    description: 'Project site located at a branch region.',
  },
  {
    source: 'employee',
    relationship: 'CREATED_BY',
    target: 'employee',
    description: 'Provenance — created by employee (edge on auditable entities).',
  },
  {
    source: 'ai_agent',
    relationship: 'CREATED_BY',
    target: 'employee',
    description: 'AI agent registered by employee.',
  },
  {
    source: 'employee',
    relationship: 'UPDATED_BY',
    target: 'employee',
    description: 'Provenance — updated by employee.',
  },

  // Generic
  {
    source: 'product',
    relationship: 'RELATED_TO',
    target: 'product',
    description: 'Cross-sell or related product association.',
  },
] as const;

/** Natural-language aliases mapping intuitive phrasing to canonical triples. */
export const ONTOLOGY_SEMANTIC_ALIASES: readonly OntologySemanticAlias[] = [
  {
    naturalLanguage: 'Machine PROVIDES Capability',
    triple: {
      source: 'machine',
      relationship: 'PROVIDES',
      target: 'capability',
      description: 'Machine provides a production capability.',
    },
  },
  {
    naturalLanguage: 'Capability ENABLES Product',
    triple: {
      source: 'product',
      relationship: 'REQUIRES',
      target: 'capability',
      description: 'Product requires capability (inverse: capability enables production).',
    },
  },
  {
    naturalLanguage: 'Customer OWNS Project',
    triple: {
      source: 'customer',
      relationship: 'OWNS',
      target: 'project',
      description: 'Customer owns a project.',
    },
  },
  {
    naturalLanguage: 'Project USES Machine',
    triple: {
      source: 'project',
      relationship: 'USES',
      target: 'machine',
      description: 'Project uses machines during delivery.',
    },
  },
  {
    naturalLanguage: 'Employee REPORTS_TO Employee',
    triple: {
      source: 'employee',
      relationship: 'REPORTS_TO',
      target: 'employee',
      description: 'Employee reports to another employee.',
    },
  },
  {
    naturalLanguage: 'Service REQUIRES Capability',
    triple: {
      source: 'service',
      relationship: 'REQUIRES',
      target: 'capability',
      description: 'Service requires a capability during delivery.',
    },
  },
] as const;

/** Ontology schema version identifier. */
export const ONTOLOGY_VERSION = '1.0.0';
