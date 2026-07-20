import { Controller, Get, Inject, Post, Body, Param, Query, Put } from '@nestjs/common';
import { CLOUD_SERVICE } from '../tokens';
import type { CloudService } from '../../application/cloud.service';
import {
  createDeploymentSchema,
  createOrganizationSchema,
  createSupportTicketSchema,
  createTenantSchema,
  tenantLifecycleSchema,
} from '../../domain/schemas';
import type { SubscriptionPlan, TenantLifecycleAction } from '../../domain/types';

@Controller('api/cloud')
export class CloudController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  overview() {
    return this.cloud.overview();
  }

  @Get('domains')
  domains() {
    return this.cloud.domains();
  }

  @Get('plans')
  plans() {
    return this.cloud.listPlans();
  }

  @Get('monitoring')
  monitoring() {
    return this.cloud.listMonitoring();
  }
}

@Controller('api/organizations')
export class OrganizationsController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list() {
    return this.cloud.listOrganizations();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.cloud.getOrganization(id);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.cloud.createOrganization(createOrganizationSchema.parse(body));
  }
}

@Controller('api/tenants')
export class TenantsController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('organizationId') organizationId?: string) {
    return this.cloud.listTenants(organizationId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.cloud.getTenant(id);
  }

  @Post()
  create(@Body() body: unknown) {
    const parsed = createTenantSchema.parse(body);
    return this.cloud.createTenant({
      organizationId: parsed.organizationId,
      name: parsed.name,
      slug: parsed.slug,
      plan: parsed.plan as SubscriptionPlan | undefined,
      region: parsed.region,
    });
  }

  @Put(':id/lifecycle')
  lifecycle(@Param('id') id: string, @Body() body: unknown) {
    const parsed = tenantLifecycleSchema.parse(body);
    return this.cloud.applyLifecycle(id, parsed.action as TenantLifecycleAction, parsed.plan as SubscriptionPlan | undefined);
  }
}

@Controller('api/subscriptions')
export class SubscriptionsController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('tenantId') tenantId?: string) {
    return this.cloud.listSubscriptions(tenantId);
  }
}

@Controller('api/deployments')
export class DeploymentsController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('tenantId') tenantId?: string) {
    return this.cloud.listDeployments(tenantId);
  }

  @Post()
  create(@Body() body: unknown) {
    const parsed = createDeploymentSchema.parse(body);
    return this.cloud.createDeployment({
      tenantId: parsed.tenantId,
      environment: parsed.environment,
      region: parsed.region ?? 'us',
      version: parsed.version,
    });
  }
}

@Controller('api/billing')
export class BillingController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('organizationId') organizationId?: string) {
    return this.cloud.listBilling(organizationId);
  }

  @Post('pay/:invoiceId')
  pay(@Param('invoiceId') invoiceId: string) {
    return this.cloud.createPaymentStub(invoiceId);
  }
}

@Controller('api/usage')
export class UsageController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('tenantId') tenantId?: string) {
    return this.cloud.listUsage(tenantId);
  }
}

@Controller('api/support')
export class SupportController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('organizationId') organizationId?: string) {
    return this.cloud.listSupport(organizationId);
  }

  @Post()
  create(@Body() body: unknown) {
    return this.cloud.createSupport(createSupportTicketSchema.parse(body));
  }
}

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'cloud-control-plane' };
  }
}

@Controller('api/backups')
export class BackupsController {
  constructor(@Inject(CLOUD_SERVICE) private readonly cloud: CloudService) {}

  @Get()
  list(@Query('tenantId') tenantId?: string) {
    return this.cloud.listBackups(tenantId);
  }
}
