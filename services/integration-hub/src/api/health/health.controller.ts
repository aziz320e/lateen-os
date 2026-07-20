import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'integration-hub' };
  }

  @Get('metrics')
  metrics() {
    return { service: 'integration-hub', metrics: 'enabled' };
  }
}
