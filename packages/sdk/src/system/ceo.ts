/**
 * CEO facade — `@lateen-os/ceo-engine`'s `createCEOEngine` is already a
 * clean, dependency-injected composition root with no repository exposed
 * on its return value, so this module only re-exports it under the names
 * this package's public surface uses.
 *
 * @module system/ceo
 */
export { createCEOEngine as createCEO } from '@lateen-os/ceo-engine';
export type { CEOEngine as CEO, CEOEngineDeps as CEOConfig } from '@lateen-os/ceo-engine';
