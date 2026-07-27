/**
 * Search — deterministic search by name, type, tags, and metadata. No
 * embeddings, no vector search.
 * @module search
 */
export * from './types.js';
export { createGraphSearchEngine, type GraphSearchEngine } from './engine.impl.js';
