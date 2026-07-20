/** @module lifecycle/process-manager */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { KernelConfig } from '../configuration/schema.js';
import type { KernelLogger } from '../bootstrap/logger.js';

export interface ManagedProcess {
  readonly name: string;
  readonly package: string;
  readonly pid: number;
  readonly startedAt: string;
}

interface ProcessStateFile {
  readonly processes: readonly ManagedProcess[];
}

export class ProcessManager {
  private readonly stateFile: string;
  private readonly children = new Map<string, ChildProcess>();

  constructor(
    private readonly config: KernelConfig,
    private readonly logger: KernelLogger,
  ) {
    const stateDir = join(config.workspaceRoot, config.stateDir);
    mkdirSync(stateDir, { recursive: true });
    this.stateFile = join(stateDir, 'processes.json');
  }

  private readState(): ProcessStateFile {
    if (!existsSync(this.stateFile)) return { processes: [] };
    return JSON.parse(readFileSync(this.stateFile, 'utf8')) as ProcessStateFile;
  }

  private writeState(processes: readonly ManagedProcess[]): void {
    writeFileSync(this.stateFile, JSON.stringify({ processes }, null, 2));
  }

  start(name: string, pkg: string, cwd: string): ManagedProcess {
    const child = spawn('pnpm', ['--filter', pkg, 'dev'], {
      cwd,
      shell: true,
      stdio: 'ignore',
      detached: false,
    });

    if (!child.pid) {
      throw new Error(`Failed to start process: ${name}`);
    }

    this.children.set(name, child);

    const managed: ManagedProcess = {
      name,
      package: pkg,
      pid: child.pid,
      startedAt: new Date().toISOString(),
    };

    const state = this.readState();
    this.writeState([...state.processes.filter((item) => item.name !== name), managed]);
    this.logger.info({ name, pid: child.pid }, 'process started');
    return managed;
  }

  stop(name?: string): readonly ManagedProcess[] {
    const state = this.readState();
    const remaining: ManagedProcess[] = [];

    for (const processInfo of state.processes) {
      if (name && processInfo.name !== name) {
        remaining.push(processInfo);
        continue;
      }

      try {
        process.kill(processInfo.pid, 'SIGTERM');
        this.logger.info({ name: processInfo.name, pid: processInfo.pid }, 'process stopped');
      } catch {
        this.logger.warn({ name: processInfo.name, pid: processInfo.pid }, 'process already stopped');
      }

      this.children.delete(processInfo.name);
    }

    this.writeState(name ? remaining : []);
    return name ? state.processes.filter((item) => item.name === name) : state.processes;
  }

  list(): readonly ManagedProcess[] {
    return this.readState().processes;
  }

  clearState(): void {
    if (existsSync(this.stateFile)) {
      rmSync(this.stateFile);
    }
  }
}

export function createProcessManager(config: KernelConfig, logger: KernelLogger): ProcessManager {
  return new ProcessManager(config, logger);
}
