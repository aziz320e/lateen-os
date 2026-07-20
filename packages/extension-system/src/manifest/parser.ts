/** @module manifest/parser */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extensionManifestSchema, EXTENSION_MANIFEST_FILENAME, type ExtensionManifest } from './types.js';

export function parseExtensionManifest(content: string): ExtensionManifest {
  const raw = JSON.parse(content) as unknown;
  return extensionManifestSchema.parse(raw);
}

export function loadExtensionManifest(extensionDir: string): ExtensionManifest {
  const manifestPath = join(extensionDir, EXTENSION_MANIFEST_FILENAME);
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing ${EXTENSION_MANIFEST_FILENAME} in ${extensionDir}`);
  }
  return parseExtensionManifest(readFileSync(manifestPath, 'utf8'));
}

export function serializeExtensionManifest(manifest: ExtensionManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}
