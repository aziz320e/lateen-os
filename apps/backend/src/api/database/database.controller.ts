import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { DatabaseHealthService } from '../../database/database-health.service.js';

// Not the documented liveness/readiness probe (that's GET /health at the
// platform-host level, see docs/release/BACKEND_ERP_WEB_OPERATIONS.md §2)
// — these return the raw Postgres error text and exact version string on
// failure/success respectively, so they require an authenticated caller.
@UseGuards(JwtAuthGuard)
@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseHealth: DatabaseHealthService) {}

  @Get('health')
  async health() {
    const result = await this.databaseHealth.check();
    return { status: result.connected ? 'healthy' : 'unhealthy', ...result };
  }

  @Get('version')
  async version() {
    return this.databaseHealth.version();
  }
}
