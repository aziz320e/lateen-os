/** @module cli/program */
import { Command } from 'commander';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { bootstrapPlatform } from '../bootstrap/bootstrap.js';
import { loadKernelConfig } from '../configuration/loader.js';
import { createDiagnosticsDoctor } from '../diagnostics/doctor.js';
import { createHealthChecker } from '../health/checker.js';
import { createLifecycleManager } from '../lifecycle/manager.js';
import { createApplicationRegistry, createPluginRegistry, createServiceRegistry } from '../registry/index.js';
import { resolveWorkspace } from '../workspace/resolver.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';
import {
  registerExtensionCommands,
  registerGatewayCommands,
  registerMarketplaceCommands,
  registerProvisioningCommands,
} from '@lateen-os/extension-system';

const VERSION = '0.0.0';

async function withBootstrap<T>(fn: (ctx: Awaited<ReturnType<typeof bootstrapPlatform>>) => Promise<T>): Promise<T> {
  const ctx = await bootstrapPlatform();
  return fn(ctx);
}

function runScript(workspaceRoot: string, script: string): Promise<number> {
  const isWindows = process.platform === 'win32';
  const scriptPath = join(workspaceRoot, 'infrastructure/scripts', isWindows ? `${script}.ps1` : `${script}.sh`);

  if (!existsSync(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  const command = isWindows ? 'powershell' : 'bash';
  const args = isWindows ? ['-File', scriptPath] : [scriptPath];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: workspaceRoot, stdio: 'inherit', shell: false });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('lateen')
    .description('Lateen OS platform kernel CLI')
    .version(VERSION, '-V, --version', 'Show version');

  program
    .command('start')
    .description('Bootstrap and start platform infrastructure and services')
    .option('--infra-only', 'Start infrastructure only')
    .option('--services-only', 'Start services only (skip infrastructure)')
    .option('--apps', 'Also start applications')
    .action(async (options) => {
      await withBootstrap(async (ctx) => {
        const lifecycle = createLifecycleManager(ctx);
        if (!options.servicesOnly) {
          await lifecycle.startInfrastructure();
        }
        if (!options.infraOnly) {
          lifecycle.startServices();
          if (options.apps) {
            lifecycle.startApplications();
          }
        }
        ctx.logger.info('platform start requested');
      });
    });

  program
    .command('stop')
    .description('Gracefully stop platform services and infrastructure')
    .action(async () => {
      await withBootstrap(async (ctx) => {
        const lifecycle = createLifecycleManager(ctx);
        await lifecycle.stop();
        await lifecycle.stopInfrastructure();
      });
    });

  program
    .command('restart')
    .description('Restart the platform')
    .action(async () => {
      await withBootstrap(async (ctx) => {
        const lifecycle = createLifecycleManager(ctx);
        await lifecycle.restart();
      });
    });

  program
    .command('status')
    .description('Show platform status')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      await withBootstrap(async (ctx) => {
        const lifecycle = createLifecycleManager(ctx);
        const health = await createHealthChecker(ctx.config).collectReport();
        const payload = {
          environment: ctx.config.environment,
          processes: lifecycle.listProcesses(),
          health,
          startupOrder: ctx.startupOrder,
        };

        if (options.json) {
          console.log(JSON.stringify(payload, null, 2));
          return;
        }

        console.log(`Lateen OS — ${ctx.config.environment}`);
        console.log(`Health: ${health.status}`);
        console.log(`Processes: ${payload.processes.length}`);
      });
    });

  program
    .command('doctor')
    .description('Run startup and recovery diagnostics')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      await withBootstrap(async (ctx) => {
        const report = await createDiagnosticsDoctor(ctx.config).run();
        ctx.events.emit('kernel.diagnostics.completed', { healthy: report.healthy });

        if (options.json) {
          console.log(JSON.stringify(report, null, 2));
          return;
        }

        console.log(report.healthy ? 'Platform diagnostics: OK' : 'Platform diagnostics: ISSUES FOUND');
        for (const issue of report.issues) {
          console.log(`[${issue.severity}] ${issue.code}: ${issue.message}`);
        }
        if (!report.healthy) process.exitCode = 1;
      });
    });

  program
    .command('logs')
    .description('Tail platform infrastructure logs')
    .action(async () => {
      const workspace = resolveWorkspace();
      const code = await runScript(workspace.root, 'logs');
      process.exitCode = code;
    });

  program
    .command('backup')
    .description('Run platform backup')
    .action(async () => {
      const workspace = resolveWorkspace();
      const code = await runScript(workspace.root, 'backup');
      process.exitCode = code;
    });

  program
    .command('restore')
    .description('Restore platform from backup')
    .action(async () => {
      const workspace = resolveWorkspace();
      const code = await runScript(workspace.root, 'restore');
      process.exitCode = code;
    });

  program
    .command('update')
    .description('Update platform dependencies')
    .action(async () => {
      const workspace = resolveWorkspace();
      await new Promise<void>((resolve, reject) => {
        const child = spawn('pnpm', ['install'], { cwd: workspace.root, stdio: 'inherit', shell: true });
        child.on('error', reject);
        child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pnpm install exited ${code}`))));
      });
    });

  const plugins = program.command('plugins').description('Plugin registry commands');

  plugins
    .command('list')
    .description('List registered plugins')
    .action(async () => {
      const registry = createPluginRegistry();
      for (const plugin of registry.list()) {
        console.log(`${plugin.id}\t${plugin.kind}\t${plugin.enabled ? 'enabled' : 'disabled'}\t${plugin.path}`);
      }
    });

  const services = program.command('services').description('Service registry commands');

  services
    .command('list')
    .description('List registered backend services')
    .action(async () => {
      const registry = createServiceRegistry();
      for (const service of registry.list()) {
        console.log(`${service.name}\t${service.port}\t${service.package}`);
      }
    });

  const apps = program.command('apps').description('Application registry commands');

  apps
    .command('list')
    .description('List registered applications')
    .action(async () => {
      const registry = createApplicationRegistry();
      for (const app of registry.list()) {
        console.log(`${app.name}\t${app.port}\t${app.package}`);
      }
    });

  program
    .command('config')
    .description('Show resolved kernel configuration')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const workspace = resolveWorkspace();
      const config = loadKernelConfig({ workspaceRoot: workspace.root });
      if (options.json) {
        console.log(JSON.stringify(config, null, 2));
        return;
      }
      console.log(`environment: ${config.environment}`);
      console.log(`workspace: ${config.workspaceRoot}`);
      console.log(`env file: ${config.envFile}`);
      console.log(`telemetry: ${config.telemetryEnabled}`);
    });

  program
    .command('version')
    .description('Show Lateen Kernel and platform manifest version')
    .action(() => {
      console.log(`lateen-kernel ${VERSION}`);
      console.log(`platform-manifest ${PLATFORM_MANIFEST.version}`);
    });

  registerExtensionCommands(program);
  registerMarketplaceCommands(program);
  registerProvisioningCommands(program);
  registerGatewayCommands(program);

  program
    .command('recover')
    .description('Attempt crash recovery')
    .action(async () => {
      await withBootstrap(async (ctx) => {
        const lifecycle = createLifecycleManager(ctx);
        await lifecycle.recover();
      });
    });

  await program.parseAsync(argv);
}
