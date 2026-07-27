/**
 * Relationship Layer — the Communication Hub's only integration point
 * with CRM Engine, Sales Engine, Marketing Engine, Business DNA,
 * Institutional Memory, Workflow Engine, and AI Workforce, exclusively
 * through their public APIs.
 * @module relationship-management
 */
export * from './types.js';
export { createRelationshipManagement, type RelationshipManagement } from './service.impl.js';
