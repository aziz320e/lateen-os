import { Global, Module } from '@nestjs/common';
import { RuntimeRegistryModule } from '../runtime-registry/runtime-registry.module.js';
import { SecurityModule } from '../security/security.module.js';
import { DatabaseBootstrapService } from './database-bootstrap.service.js';
import { DatabaseHealthService } from './database-health.service.js';
import { MigrationRunnerService } from './migration-runner.service.js';
import { PrismaService } from './prisma.service.js';
import { SeedRunnerService } from './seed-runner.service.js';

@Global()
@Module({
  imports: [RuntimeRegistryModule, SecurityModule],
  providers: [
    PrismaService,
    MigrationRunnerService,
    DatabaseHealthService,
    DatabaseBootstrapService,
    SeedRunnerService,
  ],
  exports: [PrismaService, DatabaseHealthService],
})
export class DatabaseModule {}
