import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createExtensionSystem } from '@lateen-os/extension-system';
import { PROVIDER_DEFINITIONS } from '../src/providers/registry.js';

const WORKSPACE_ROOT = join(import.meta.dirname, '../../..');

describe('Integration Provider Discovery', () => {
  it('discovers all 18 provider extensions', async () => {
    const system = createExtensionSystem(WORKSPACE_ROOT);
    const discovered = await system.discovery.discover({ workspaceRoot: WORKSPACE_ROOT });

    const connectorExtensions = discovered.filter((d) => d.manifest.type === 'connector');
    expect(connectorExtensions.length).toBeGreaterThanOrEqual(18);

    for (const def of PROVIDER_DEFINITIONS) {
      const ext = connectorExtensions.find((e) => e.manifest.id === `${def.folder}-connector`);
      expect(ext, `Missing extension for ${def.folder}`).toBeDefined();
      expect(ext!.manifest.connectors).toContain(def.definitionCode);
    }
  });

  it('validates all provider extension manifests', async () => {
    const system = createExtensionSystem(WORKSPACE_ROOT);

    for (const def of PROVIDER_DEFINITIONS) {
      const extPath = join(WORKSPACE_ROOT, 'extensions', def.folder);
      expect(existsSync(join(extPath, 'extension.json'))).toBe(true);

      const { loadExtensionManifest } = await import('@lateen-os/extension-system');
      const manifest = loadExtensionManifest(extPath);
      const result = system.queries.validateExtension({ manifest });
      expect(result.valid, `${def.folder} validation: ${result.issues.map((i) => i.message).join(', ')}`).toBe(true);
    }
  });
});

describe('Marketplace Install Compatibility', () => {
  it('each provider has marketplace-ready extension.json', () => {
    for (const def of PROVIDER_DEFINITIONS) {
      const extPath = join(WORKSPACE_ROOT, 'extensions', def.folder, 'extension.json');
      expect(existsSync(extPath)).toBe(true);

      const content = JSON.parse(readFileSync(extPath, 'utf8'));
      expect(content.type).toBe('connector');
      expect(content.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(content.connectors).toContain(def.definitionCode);
      expect(content.permissions.length).toBeGreaterThan(0);
    }
  });

  it('extension ids follow marketplace naming convention', () => {
    for (const def of PROVIDER_DEFINITIONS) {
      expect(`${def.folder}-connector`).toMatch(/^[a-z0-9-]+-connector$/);
    }
  });
});
