/**
 * Content Library — templates, campaign assets, landing pages, and
 * media references.
 * @module content
 */
export * from './types.js';
export * from './repository.js';
export { createContentRepository } from './repository.impl.js';
export {
  createContentLibrary,
  type ContentLibrary,
  type CreateContentItemInput,
  type UpdateContentItemInput,
} from './library.impl.js';
