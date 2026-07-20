/** @module lifecycle/manager */
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import type { BootstrapResult } from '../bootstrap/types.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';
import { createProcessManager } from './process-manager.js';
import { gracefulShutdown } from './shutdown.js';

export class LifecycleManager {
  private readonly processManager;

  constructor(private readonly bootstrap: BootstrapResult) {
    this.processManager = createProcessManager(bootstrap.config, bootstrap.logger);
  }

  async startInfrastructure(): Promise<void> {
    if (!this.bootstrap.config.infraEnabled) return;

    const composeDir = join(this.bootstrap.config.workspaceRoot, 'infrastructure/docker');
    const envFile =
      this.bootstrap.config.envFile ??
      join(this.bootstrap.config.workspaceRoot, 'infrastructure/environments/.env.development');

    await new Promise<void>((resolve, reject) => {
      const child = spawn('docker', ['compose', '--env-file', envFile, 'up', '-d'], {
        cwd: composeDir,
        shell: true,
        stdio: 'inherit',
      });
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`docker compose exited ${code}`))));
    });

    this.bootstrap.events.emit('kernel.started', { phase: 'infrastructure' });
  }

  async stopInfrastructure(): Promise<void> {
    const composeDir = join(this.bootstrap.config.workspaceRoot, 'infrastructure/docker');
    const envFile =
      this.bootstrap.config.envFile ??
      join(this.bootstrap.config.workspaceRoot, 'infrastructure/environments/.env.development');

    await new Promise<void>((resolve, reject) => {
      const child = spawn('docker', ['compose', '--env-file', envFile, 'down'], {
        cwd: composeDir,
        shell: true,
        stdio: 'inherit',
      });
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`docker compose exited ${code}`))));
    });
  }

  startServices(serviceNames?: readonly string[]): readonly string[] {
    this.bootstrap.events.emit('kernel.starting');
    const started: string[] = [];
    const order = this.bootstrap.startupOrder.filter((name) =>
      PLATFORM_MANIFEST.services.some((service) => service.name === name),
    );

    for (const name of order) {
      if (serviceNames && !serviceNames.includes(name)) continue;
      const service = PLATFORM_MANIFEST.services.find((item) => item.name === name);
      if (!service) continue;

      this.processManager.start(
        service.name,
        service.package,
        this.bootstrap.config.workspaceRoot,
      );
      started.push(service.name);
    }

    this.bootstrap.events.emit('kernel.started', { services: started });
    return started;
  }

  startApplications(appNames?: readonly string[]): readonly string[] {
    const started: string[] = [];

    for (const app of PLATFORM_MANIFEST.applications) {
      if (appNames && !appNames.includes(app.name)) continue;
      this.processManager.start(app.name, app.package, this.bootstrap.config.workspaceRoot);
      started.push(app.name);
    }

    return started;
  }

  async stop(): Promise<void> {
    await gracefulShutdown(
      this.processManager,
      this.bootstrap.events,
      this.bootstrap.logger,
      { timeoutMs: this.bootstrap.config.gracefulShutdownMs },
    );
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.startInfrastructure();
    this.startServices();
    this.startApplications();
  }

  listProcesses() {
    return this.processManager.list();
  }

  async recover(): Promise<void> {
    this.bootstrap.events.emit('kernel.recovery.started');
    this.bootstrap.logger.info('crash recovery started');
    this.processManager.stop();
    await this.startInfrastructure();
    this.startServices();
    this.bootstrap.events.emit('kernel.recovery.completed');
  }
}

export function createLifecycleManager(bootstrap: BootstrapResult): LifecycleManager {
  return new LifecycleManager(bootstrap);
}
