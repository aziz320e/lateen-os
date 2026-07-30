/**
 * Migration Runner — applies pending Prisma migrations
 * (`prisma/migrations/*`) against the configured database at startup.
 * Wraps the real `prisma migrate deploy` CLI (the same tool
 * `pnpm db:migrate:deploy` invokes) rather than reimplementing schema
 * migration — this component only decides *when* to run it.
 *
 * Resilient by design: an unreachable database (or an unapplied schema)
 * is logged, not fatal — the host still starts, and
 * `GET /database/health` reports the real degraded state.
 */
import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const packageRoot = fileURLToPath(new URL('../../', import.meta.url));

export interface MigrationResult {
  readonly applied: boolean;
  readonly output?: string;
  readonly error?: string;
}

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  async deploy(): Promise<MigrationResult> {
    try {
      const { stdout } = await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], {
        cwd: packageRoot,
        timeout: 30_000,
        shell: process.platform === 'win32',
      });
      this.logger.log('Prisma migrations applied.');
      return { applied: true, output: stdout };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Migration Runner could not apply migrations: ${message}`);
      return { applied: false, error: message };
    }
  }
}
