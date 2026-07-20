import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createExtensionSystem, loadExtensionManifest } from '@lateen-os/extension-system';
import { printingIndustryPack } from '../src/index.js';

const WORKSPACE_ROOT = join(import.meta.dirname, '../../..');
const EXT_PATH = join(WORKSPACE_ROOT, 'extensions', 'printing-industry');

describe('Printing Industry Pack', () => {
  it('exports complete catalog', () => {
    expect(printingIndustryPack.products).toHaveLength(20);
    expect(printingIndustryPack.machines).toHaveLength(12);
    expect(printingIndustryPack.materials).toHaveLength(14);
    expect(printingIndustryPack.capabilities).toHaveLength(11);
    expect(printingIndustryPack.workflows).toHaveLength(8);
    expect(printingIndustryPack.missions).toHaveLength(6);
    expect(printingIndustryPack.workers).toHaveLength(6);
    expect(printingIndustryPack.dashboards).toHaveLength(6);
    expect(printingIndustryPack.reports).toHaveLength(6);
    expect(printingIndustryPack.kpis).toHaveLength(8);
    expect(printingIndustryPack.departments).toHaveLength(7);
  });

  it('includes key products', () => {
    const ids = printingIndustryPack.products.map((p) => p.id);
    expect(ids).toContain('business-cards');
    expect(ids).toContain('vehicle-wrap');
    expect(ids).toContain('exhibition-booth');
  });

  it('workflow ids match extension manifest', () => {
    const manifest = JSON.parse(readFileSync(join(EXT_PATH, 'extension.json'), 'utf8'));
    const packIds = printingIndustryPack.workflows.map((w) => w.id);
    for (const id of manifest.workflows) {
      expect(packIds).toContain(id);
    }
  });
});

describe('Extension Discovery', () => {
  it('discovers printing-industry extension', async () => {
    const system = createExtensionSystem(WORKSPACE_ROOT);
    const discovered = await system.discovery.discover({ workspaceRoot: WORKSPACE_ROOT });
    const pack = discovered.find((d) => d.manifest.id === 'printing-industry');
    expect(pack).toBeDefined();
    expect(pack!.manifest.type).toBe('industry-pack');
    expect(pack!.manifest.industry).toBe('printing');
  });

  it('validates extension manifest', () => {
    const system = createExtensionSystem(WORKSPACE_ROOT);
    const manifest = loadExtensionManifest(EXT_PATH);
    const result = system.queries.validateExtension({ manifest });
    expect(result.valid, result.issues.map((i) => i.message).join(', ')).toBe(true);
  });
});

describe('Marketplace Compatibility', () => {
  it('has marketplace-ready extension.json', () => {
    expect(existsSync(join(EXT_PATH, 'extension.json'))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(EXT_PATH, 'extension.json'), 'utf8'));
    expect(manifest.type).toBe('industry-pack');
    expect(manifest.version).toMatch(/^1\.0\.0/);
    expect(manifest.industry).toBe('printing');
    expect(manifest.permissions.length).toBeGreaterThan(0);
    expect(manifest.main).toBe('dist/index.js');
  });
});
