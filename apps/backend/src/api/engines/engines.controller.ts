import { Controller, Get } from '@nestjs/common';
import { RuntimeRegistryService } from '../../runtime-registry/runtime-registry.service.js';

@Controller()
export class EnginesController {
  constructor(private readonly registry: RuntimeRegistryService) {}

  /** Runtime Discovery: every real package in the platform's engine catalog, and whether this host is actually running it. */
  @Get('engines')
  engines() {
    const statuses = this.registry.statuses();
    return {
      total: statuses.length,
      hosted: statuses.filter((status) => status.hosted).length,
      running: statuses.filter((status) => status.status === 'running').length,
      engines: statuses,
    };
  }
}
