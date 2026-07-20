/** @module cli/marketplace */
import type { Command } from 'commander';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createExtensionSystem } from '../system/extension-system.js';
import { loadExtensionManifest } from '../manifest/parser.js';

const DEFAULT_MARKETPLACE_URL = process.env.LATEEN_MARKETPLACE_BASE_URL ?? 'http://localhost:4006';

function findWorkspaceRoot(start = process.cwd()): string {
  let current = start;
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = join(current, '..');
    if (parent === current) return start;
    current = parent;
  }
}

async function marketplaceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEFAULT_MARKETPLACE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Marketplace request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function registerMarketplaceCommands(program: Command): void {
  const marketplace = program.command('marketplace').description('Marketplace distribution commands');

  marketplace
    .command('search <query>')
    .description('Search marketplace extensions')
    .option('--json', 'Output JSON')
    .option('--category <category>', 'Filter by category')
    .action(async (query: string, options) => {
      const params = new URLSearchParams({ q: query });
      if (options.category) params.set('category', options.category);
      const result = await marketplaceFetch<{ extensions: Array<{ extensionId: string; manifest: { displayName: string; version: string } }>; total: number }>(
        `/api/search?${params}`,
      );

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(`Found ${result.total} extensions`);
      for (const ext of result.extensions) {
        console.log(`${ext.extensionId}\t${ext.manifest.displayName}\tv${ext.manifest.version}`);
      }
    });

  marketplace
    .command('install <extensionId>')
    .description('Install extension from marketplace')
    .option('--version <version>', 'Specific version')
    .option('--channel <channel>', 'Release channel', 'stable')
    .action(async (extensionId: string, options) => {
      const root = findWorkspaceRoot();
      const system = createExtensionSystem(root);

      const result = await marketplaceFetch<{
        installation: { status: string; version: string };
        release: { manifest: unknown };
        permissionWarnings: string[];
      }>('/api/install', {
        method: 'POST',
        body: JSON.stringify({
          extensionId,
          version: options.version,
          channel: options.channel,
        }),
      });

      if (result.permissionWarnings.length > 0) {
        console.warn('Permission warnings:', result.permissionWarnings.join(', '));
      }

      console.log(`Marketplace install: ${extensionId} v${result.installation.version} (${result.installation.status})`);

      const cacheDir = join(root, '.lateen', 'marketplace', extensionId);
      if (existsSync(cacheDir)) {
        const id = await system.installer.install(cacheDir);
        console.log(`Local extension installed: ${id}`);
      }
    });

  marketplace
    .command('update <extensionId>')
    .description('Update installed extension to latest release')
    .option('--channel <channel>', 'Release channel', 'stable')
    .action(async (extensionId: string, options) => {
      const root = findWorkspaceRoot();
      const system = createExtensionSystem(root);

      const result = await marketplaceFetch<{
        installation: { status: string; version: string };
      }>('/api/install', {
        method: 'POST',
        body: JSON.stringify({ extensionId, channel: options.channel }),
      });

      console.log(`Updated ${extensionId} to v${result.installation.version}`);

      const cacheDir = join(root, '.lateen', 'marketplace', extensionId);
      if (existsSync(cacheDir)) {
        await system.loader.reload(extensionId, { hotReload: system.config.hotReload });
        console.log(`Reloaded extension: ${extensionId}`);
      }
    });

  marketplace
    .command('publish <path>')
    .description('Publish extension to marketplace')
    .option('--publisher <publisherId>', 'Publisher ID')
    .option('--channel <channel>', 'Release channel', 'stable')
    .option('--json', 'Output JSON')
    .action(async (path: string, options) => {
      const root = findWorkspaceRoot();
      const resolved = join(root, path);
      const manifest = loadExtensionManifest(resolved);

      const system = createExtensionSystem(root);
      const validation = system.queries.validateExtension({ manifest });
      if (!validation.valid) {
        console.error('Manifest validation failed');
        for (const issue of validation.issues) {
          console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
        }
        process.exitCode = 1;
        return;
      }

      let publisherId = options.publisher;
      if (!publisherId) {
        const publishers = await marketplaceFetch<Array<{ id: string; slug: string }>>('/api/publishers');
        publisherId = publishers[0]?.id;
      }
      if (!publisherId) {
        throw new Error('No publisher available. Provide --publisher <id>');
      }

      const manifestContent = readFileSync(join(resolved, 'extension.json'), 'utf8');
      const result = await marketplaceFetch('/api/releases/publish', {
        method: 'POST',
        body: JSON.stringify({
          publisherId,
          manifest: JSON.parse(manifestContent),
          channel: options.channel,
          releaseNotes: `Published via lateen marketplace publish`,
        }),
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(`Published ${manifest.id} v${manifest.version} to marketplace`);
    });
}
