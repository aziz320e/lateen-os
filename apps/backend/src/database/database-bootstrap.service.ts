/**
 * Database Bootstrap — runs once at host startup: apply pending
 * migrations (Migration Runner), then verify the connection (Health
 * Check). Resilient by design: if PostgreSQL is unreachable in this
 * environment, the host still starts — every downstream consumer reads
 * the real, observed state through `DatabaseHealthService`, never an
 * assumption.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseHealthService } from './database-health.service.js';
import { MigrationRunnerService } from './migration-runner.service.js';

@Injectable()
export class DatabaseBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(
    private readonly migrationRunner: MigrationRunnerService,
    private readonly health: DatabaseHealthService,
  ) {}

  async onModuleInit(): Promise<void> {
    const migration = await this.migrationRunner.deploy();
    const health = await this.health.check();
    if (migration.applied && health.connected) {
      this.logger.log('Database Bootstrap complete — migrations applied, connection healthy.');
    } else {
      this.logger.warn(
        `Database Bootstrap incomplete (migrationsApplied=${migration.applied}, connected=${health.connected}). ` +
          'The host will continue running; database-backed features will report their real degraded state.',
      );
    }
  }
}
