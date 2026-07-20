/** @module cli/provisioning */
import type { Command } from 'commander';

const DEFAULT_PROVISIONING_URL = process.env.LATEEN_PROVISIONING_BASE_URL ?? 'http://localhost:4007';

async function provisioningFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEFAULT_PROVISIONING_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message ?? `Provisioning request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function registerProvisioningCommands(program: Command): void {
  program
    .command('new')
    .description('Create a new organization (interactive provisioning)')
    .option('--name <name>', 'Organization name')
    .option('--profile <profile>', 'Provisioning profile', 'small-business')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const name = options.name ?? 'New Organization';
      const job = await provisioningFetch<{ id: string; status: string; report?: { summary: string } }>('/api/provision', {
        method: 'POST',
        body: JSON.stringify({ organizationName: name, profile: options.profile }),
      });
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
        return;
      }
      console.log(`Provisioned: ${name} (${job.status})`);
      if (job.report) console.log(job.report.summary);
    });

  const provision = program.command('provision').description('Provisioning commands');

  provision
    .command('start')
    .description('Start provisioning job')
    .requiredOption('--name <name>', 'Organization name')
    .option('--profile <profile>', 'Profile', 'enterprise')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const job = await provisioningFetch('/api/provision', {
        method: 'POST',
        body: JSON.stringify({ organizationName: options.name, profile: options.profile }),
      });
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
        return;
      }
      console.log(`Provisioning job started: ${(job as { id: string }).id}`);
    });

  provision
    .command('status')
    .description('Get provisioning status summary')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const status = await provisioningFetch('/api/provision/status');
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }
      const s = status as { total: number; completed: number; running: number; failed: number };
      console.log(`Total: ${s.total} | Completed: ${s.completed} | Running: ${s.running} | Failed: ${s.failed}`);
    });

  provision
    .command('get <id>')
    .description('Get provisioning job by ID')
    .option('--json', 'Output JSON')
    .action(async (id: string, options) => {
      const job = await provisioningFetch(`/api/provision/${id}`);
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
        return;
      }
      const j = job as { id: string; status: string; organizationName: string };
      console.log(`${j.id}\t${j.organizationName}\t${j.status}`);
    });

  const organization = program.command('organization').description('Organization commands');

  organization
    .command('create')
    .description('Create and provision a new organization')
    .requiredOption('--name <name>', 'Organization name')
    .option('--profile <profile>', 'Provisioning profile', 'printing')
    .option('--country <country>', 'Country code')
    .option('--json', 'Output JSON')
    .action(async (options) => {
      const job = await provisioningFetch('/api/provision', {
        method: 'POST',
        body: JSON.stringify({
          organizationName: options.name,
          profile: options.profile,
          country: options.country,
        }),
      });
      if (options.json) {
        console.log(JSON.stringify(job, null, 2));
        return;
      }
      console.log(`Organization created: ${options.name}`);
      console.log(`Job: ${(job as { id: string }).id}`);
    });
}
