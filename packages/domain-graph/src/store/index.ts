/**
 * Real, in-memory, tenant-scoped storage layer for the Domain Graph
 * runtime. Internal — never exposed by the composition root.
 *
 * @module store
 */
export * from './entity-repository.js';
export { createEntityRepository } from './entity-repository.impl.js';
export * from './relationship-repository.js';
export { createRelationshipRepository } from './relationship-repository.impl.js';
export * from './graph-repository.js';
export { createGraphRepository } from './graph-repository.impl.js';
