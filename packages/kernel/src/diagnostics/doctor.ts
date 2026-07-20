/** @module diagnostics/doctor */
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { KernelConfig } from '../configuration/schema.js';
import { validateEnvironment } from '../environment/validator.js';
import { PLATFORM_MANIFEST } from '../registry/manifest.js';
import { createDependencyGraphBuilder } from '../dependency/graph.js';
import { createPluginRegistry } from '../registry/plugin-registry.js';
import type { DiagnosticIssue, DiagnosticReport } from './types.js';

async function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

export class DiagnosticsDoctor {
  constructor(private readonly config: KernelConfig) {}

  async run(env: NodeJS.ProcessEnv = process.env): Promise<DiagnosticReport> {
    const issues: DiagnosticIssue[] = [];

    const envResult = validateEnvironment(this.config, env);
    for (const issue of envResult.issues) {
      issues.push({
        code: issue.code,
        message: issue.message,
        severity: issue.severity,
        remediation: 'Check infrastructure/environments/.env.development',
      });
    }

    const allPorts = [
      ...PLATFORM_MANIFEST.services.map((service) => ({ name: service.name, port: service.port })),
      ...PLATFORM_MANIFEST.applications.map((app) => ({ name: app.name, port: app.port })),
    ];

    const portMap = new Map<number, string[]>();
    for (const entry of allPorts) {
      const names = portMap.get(entry.port) ?? [];
      names.push(entry.name);
      portMap.set(entry.port, names);
    }

    for (const [port, names] of portMap.entries()) {
      if (names.length > 1) {
        issues.push({
          code: 'PORT_CONFLICT',
          message: `Port ${port} assigned to multiple units: ${names.join(', ')}`,
          severity: 'warning',
          remediation: 'Remap host ports in environment configuration',
        });
      }

      const available = await isPortAvailable(port);
      if (!available) {
        issues.push({
          code: 'PORT_IN_USE',
          message: `Port ${port} is already in use (${names.join(', ')})`,
          severity: 'warning',
          remediation: `Stop conflicting process or change port for ${names[0]}`,
        });
      }
    }

    const builder = createDependencyGraphBuilder();
    try {
      builder.resolveStartupOrder(builder.build(PLATFORM_MANIFEST.services));
    } catch (error) {
      issues.push({
        code: 'DEPENDENCY_CYCLE',
        message: error instanceof Error ? error.message : 'Dependency graph cycle',
        severity: 'error',
      });
    }

    const plugins = createPluginRegistry();
    for (const plugin of plugins.list()) {
      const pluginPath = join(this.config.workspaceRoot, plugin.path);
      if (!existsSync(pluginPath)) {
        issues.push({
          code: 'PLUGIN_PATH_MISSING',
          message: `Plugin path not found: ${plugin.path}`,
          severity: 'warning',
        });
      }
    }

    if (this.config.environment === 'production' && env.LATEEN_ENV !== 'production') {
      issues.push({
        code: 'VERSION_MISMATCH',
        message: 'Kernel configured for production but LATEEN_ENV is not production',
        severity: 'warning',
      });
    }

    const dbUrl = env.LATEEN_DATABASE_URL;
    if (dbUrl && dbUrl.includes('change-me')) {
      issues.push({
        code: 'DATABASE_CONFIG',
        message: 'Database URL contains placeholder credentials',
        severity: 'warning',
        remediation: 'Update LATEEN_DATABASE_URL in environment file',
      });
    }

    return {
      healthy: !issues.some((issue) => issue.severity === 'error'),
      checkedAt: new Date().toISOString(),
      issues,
    };
  }
}

export function createDiagnosticsDoctor(config: KernelConfig): DiagnosticsDoctor {
  return new DiagnosticsDoctor(config);
}
