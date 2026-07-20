import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'mission-scheduler' };
  }

  @Get('metrics')
  metrics() {
    return { service: 'mission-scheduler', metrics: 'enabled' };
  }
}
