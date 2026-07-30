import { Controller, Get } from '@nestjs/common';
import { DatabaseHealthService } from '../../database/database-health.service.js';

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
