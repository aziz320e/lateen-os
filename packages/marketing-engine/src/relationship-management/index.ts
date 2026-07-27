/**
 * Relationship Layer — the Marketing Engine's only integration point
 * with CRM Engine, Sales Engine, Business DNA, Institutional Memory,
 * and Domain Graph, exclusively through their public APIs.
 * @module relationship-management
 */
export * from './types.js';
export { createRelationshipManagement, type RelationshipManagement } from './service.impl.js';
