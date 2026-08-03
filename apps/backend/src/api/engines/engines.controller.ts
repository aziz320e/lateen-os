import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RuntimeRegistryService } from '../../runtime-registry/runtime-registry.service.js';

// Not a liveness/readiness probe (those are GET /health and GET /version,
// see docs/release/BACKEND_ERP_WEB_OPERATIONS.md §2) — `statuses()` below
// includes the raw captured exception message for any engine that failed
// to construct, so this requires an authenticated caller.
@UseGuards(JwtAuthGuard)
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
