/**
 * Relationship Layer — the Sales Engine's only integration point with
 * CRM Engine, Business DNA, and Institutional Memory, exclusively
 * through their public APIs.
 * @module relationship-management
 */
export * from './types.js';
export { createRelationshipManagement, type RelationshipManagement } from './service.impl.js';
