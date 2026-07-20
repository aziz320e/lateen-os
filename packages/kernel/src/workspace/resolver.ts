/** @module workspace/resolver */
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKERS = ['pnpm-workspace.yaml', 'turbo.json'] as const;

export interface WorkspaceInfo {
  readonly root: string;
  readonly packagesDir: string;
  readonly servicesDir: string;
  readonly appsDir: string;
  readonly infrastructureDir: string;
  readonly deploymentDir: string;
}

export function findWorkspaceRoot(startDir = process.cwd()): string {
  let current = resolve(startDir);

  while (true) {
    if (MARKERS.every((marker) => existsSync(join(current, marker)))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error('Lateen OS workspace root not found');
    }
    current = parent;
  }
}

export function resolveWorkspace(startDir?: string): WorkspaceInfo {
  const root = findWorkspaceRoot(startDir);
  return {
    root,
    packagesDir: join(root, 'packages'),
    servicesDir: join(root, 'services'),
    appsDir: join(root, 'apps'),
    infrastructureDir: join(root, 'infrastructure'),
    deploymentDir: join(root, 'deployment'),
  };
}

export function resolveFromModule(): WorkspaceInfo {
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  return resolveWorkspace(join(moduleDir, '../../..'));
}
