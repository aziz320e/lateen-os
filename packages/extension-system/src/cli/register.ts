/** @module cli/register */
import type { Command } from 'commander';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createExtensionSystem } from '../system/extension-system.js';

function findWorkspaceRoot(start = process.cwd()): string {
  let current = start;
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = join(current, '..');
    if (parent === current) return start;
    current = parent;
  }
}

export function registerExtensionCommands(program: Command): void {
  const extensions = program.command('extensions').description('Extension system commands');

  extensions
    .command('list')
    .description('List installed extensions')
    .option('--json', 'Output JSON')
    .option('--status <status>', 'Filter by status')
    .action(async (options) => {
      const system = createExtensionSystem(findWorkspaceRoot());
      await system.discoverAndRegister();
      const result = system.queries.listExtensions(
        options.status ? { status: options.status } : {},
      );

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      for (const ext of result.extensions) {
        console.log(`${ext.manifest.id}\t${ext.manifest.version}\t${ext.status}\t${ext.manifest.type}`);
      }
    });

  extensions
    .command('install <path>')
    .description('Install extension from directory')
    .action(async (path: string) => {
      const root = findWorkspaceRoot();
      const system = createExtensionSystem(root);
      const resolved = join(root, path);
      const id = await system.installer.install(resolved);
      console.log(`Installed extension: ${id}`);
    });

  extensions
    .command('remove <id>')
    .description('Remove installed extension')
    .action(async (id: string) => {
      const system = createExtensionSystem(findWorkspaceRoot());
      await system.installer.remove(id);
      console.log(`Removed extension: ${id}`);
    });

  extensions
    .command('enable <id>')
    .description('Enable extension')
    .action(async (id: string) => {
      const system = createExtensionSystem(findWorkspaceRoot());
      system.registry.enable(id);
      console.log(`Enabled extension: ${id}`);
    });

  extensions
    .command('disable <id>')
    .description('Disable extension')
    .action(async (id: string) => {
      const system = createExtensionSystem(findWorkspaceRoot());
      system.registry.disable(id);
      console.log(`Disabled extension: ${id}`);
    });

  extensions
    .command('validate <path>')
    .description('Validate extension manifest')
    .option('--json', 'Output JSON')
    .action(async (path: string, options) => {
      const root = findWorkspaceRoot();
      const system = createExtensionSystem(root);
      const { loadExtensionManifest } = await import('../manifest/parser.js');
      const manifest = loadExtensionManifest(join(root, path));
      const result = system.queries.validateExtension({ manifest });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      console.log(result.valid ? 'Valid' : 'Invalid');
      for (const issue of result.issues) {
        console.log(`[${issue.severity}] ${issue.code}: ${issue.message}`);
      }
      if (!result.valid) process.exitCode = 1;
    });

  extensions
    .command('reload <id>')
    .description('Reload extension (supports hot reload in development)')
    .action(async (id: string) => {
      const system = createExtensionSystem(findWorkspaceRoot());
      await system.loader.reload(id, { hotReload: system.config.hotReload });
      console.log(`Reloaded extension: ${id}`);
    });
}
