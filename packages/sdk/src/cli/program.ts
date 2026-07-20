/** @module cli/program */
import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { formatSdkVersion, SDK_VERSION } from '../core/version.js';
import { validateManifest } from '../validation/manifest.js';
import { listTemplates } from '../templates/registry.js';
import { initSdkProject, scaffoldExtension } from './scaffold.js';

function findWorkspaceRoot(start = process.cwd()): string {
  let current = start;
  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = join(current, '..');
    if (parent === current) return start;
    current = parent;
  }
}

export async function runSdkCli(argv: string[]): Promise<void> {
  const program = new Command();

  program.name('lateen-sdk').description('Lateen SDK CLI').version(formatSdkVersion());

  program
    .command('init')
    .description('Initialize a Lateen extension project')
    .option('--dir <path>', 'Workspace root', findWorkspaceRoot())
    .action((options) => {
      const files = initSdkProject(options.dir);
      console.log(`Initialized: ${files.join(', ')}`);
    });

  const create = program.command('create').description('Scaffold a new extension');

  for (const kind of listTemplates()) {
    create
      .command(kind)
      .description(`Create ${kind} extension`)
      .argument('<name>', 'Extension name (kebab-case)')
      .option('--dir <path>', 'Workspace root', findWorkspaceRoot())
      .action((name: string, options) => {
        const files = scaffoldExtension({
          workspaceRoot: options.dir,
          kind,
          name,
        });
        console.log(`Created ${kind} "${name}":`);
        for (const file of files) console.log(`  ${file}`);
      });
  }

  program
    .command('doctor')
    .description('Validate SDK environment and sample manifests')
    .action(() => {
      const issues: string[] = [];
      const root = findWorkspaceRoot();

      if (!existsSync(join(root, 'pnpm-workspace.yaml'))) {
        issues.push('Not inside a Lateen OS workspace');
      }

      const pluginCheck = validateManifest('plugin', {
        id: 'sample',
        name: 'Sample',
        version: '1.0.0',
        kind: 'package',
        path: 'extensions/sample',
      });

      if (!pluginCheck.success) {
        issues.push('Plugin schema validation failed');
      }

      if (SDK_VERSION.architecture !== '1.0') {
        issues.push(`Architecture mismatch: SDK targets ${SDK_VERSION.architecture}`);
      }

      if (issues.length === 0) {
        console.log('Lateen SDK doctor: OK');
        console.log(`SDK ${formatSdkVersion()} | Architecture v${SDK_VERSION.architecture}`);
        return;
      }

      console.error('Lateen SDK doctor: ISSUES FOUND');
      for (const issue of issues) console.error(`  - ${issue}`);
      process.exitCode = 1;
    });

  await program.parseAsync(argv);
}
