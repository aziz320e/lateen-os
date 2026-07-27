/**
 * Graph module — core graph structures, plus the real Graph Lifecycle.
 *
 * @module graph
 */
export * from './types.js';
export * from './algorithms.js';
export * from './repository.js';
export { createDomainGraphRepository } from './repository.impl.js';
export {
  createGraphLifecycle,
  canTransitionGraph,
  type GraphLifecycle,
  type CreateDomainGraphInput,
  type UpdateDomainGraphInput,
  type RebuildStats,
} from './lifecycle.impl.js';
