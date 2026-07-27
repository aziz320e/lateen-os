/**
 * Relationship Management — real integration with Business DNA (via
 * shared identifiers), Domain Graph, and Institutional Memory, exclusively
 * through their public APIs.
 * @module relationship-management
 */
export * from './types.js';
export { createRelationshipManagement, type RelationshipManagement } from './service.impl.js';
