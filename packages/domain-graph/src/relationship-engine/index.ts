/**
 * Relationship Engine — real, dangling-guarded typed relationships
 * between registered graph entities.
 * @module relationship-engine
 */
export * from './types.js';
export { createRelationshipEngine, type RelationshipEngine } from './engine.impl.js';
