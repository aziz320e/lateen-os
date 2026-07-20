/** @module queries/types */
import type { ExtensionManifest } from '../manifest/types.js';
import type { InstalledExtension } from '../registry/types.js';
import type { ExtensionValidationResult } from '../validator/extension-validator.js';
import type { DiscoveredExtension } from '../discovery/scanner.js';

export interface ListExtensionsQuery {
  readonly status?: 'enabled' | 'disabled' | 'failed' | 'pending';
}

export interface ListExtensionsResult {
  readonly extensions: readonly InstalledExtension[];
  readonly total: number;
}

export interface FindExtensionQuery {
  readonly id: string;
}

export interface FindExtensionResult {
  readonly extension?: InstalledExtension;
  readonly discovered?: DiscoveredExtension;
}

export interface ValidateExtensionQuery {
  readonly manifest: unknown;
}

export type ValidateExtensionResult = ExtensionValidationResult;

export interface CheckCompatibilityQuery {
  readonly manifest: ExtensionManifest;
}

export type CheckCompatibilityResult = ExtensionValidationResult;
