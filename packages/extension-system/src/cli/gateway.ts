/** @module cli/gateway */
import type { Command } from 'commander';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const DEFAULT_GATEWAY_URL = process.env.LATEEN_GATEWAY_BASE_URL ?? 'http://localhost:4008';

async function gatewayFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${DEFAULT_GATEWAY_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string; error?: string }).error ?? `Gateway request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function resolveWorkspaceRoot(): string {
  return process.env.LATEEN_WORKSPACE_ROOT ?? process.cwd();
}

export function registerGatewayCommands(program: Command): void {
  const gateway = program.command('gateway').description('Enterprise API Gateway commands');

  gateway
    .command('start')
    .description('Start the API Gateway service')
    .option('--dev', 'Run in development mode')
    .action(async (options) => {
      const root = resolveWorkspaceRoot();
      const servicePath = join(root, 'services', 'api-gateway');
      const command = options.dev ? 'pnpm dev' : 'pnpm start';
      const child = spawn(command, { cwd: servicePath, stdio: 'inherit', shell: true });
      await new Promise<void>((resolve, reject) => {
        child.on('error', reject);
        child.on('exit', () => resolve());
      });
    });

  gateway
    .command('status')
    .description('Show gateway status and metrics')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const status = await gatewayFetch<{
        service: string;
        version: string;
        uptimeSeconds: number;
        routes: { total: number; active: number; planned: number };
        metrics: Record<string, number>;
      }>('/gateway/status');
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      console.log(`${status.service} v${status.version}`);
      console.log(`Uptime: ${status.uptimeSeconds}s`);
      console.log(`Routes: ${status.routes.active}/${status.routes.total} active (${status.routes.planned} planned)`);
      console.log(
        `Metrics: requests=${status.metrics.totalRequests} errors=${status.metrics.proxyErrors} rateLimited=${status.metrics.rateLimited}`,
      );
    });

  gateway
    .command('routes')
    .description('List gateway route registry')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const data = await gatewayFetch<{
        routes: Array<{
          id: string;
          displayName: string;
          gatewayPrefix: string;
          serviceName: string;
          status: string;
        }>;
      }>('/gateway/routes');
      if (options.json) {
        console.log(JSON.stringify(data.routes, null, 2));
        return;
      }
      for (const route of data.routes) {
        console.log(`${route.id.padEnd(14)} ${route.gatewayPrefix.padEnd(22)} ${route.serviceName.padEnd(22)} ${route.status}`);
      }
    });
}
