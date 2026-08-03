/**
 * Seed Runner — creates deterministic baseline data through the real
 * engines already hosted by the Runtime Registry (organization,
 * business profile, employees, customers, products, warehouses, chart
 * of accounts, project — the same pattern already proven in
 * `apps/erp-web`'s seed and `packages/integration-tests`' scenario
 * fixtures), then mirrors it into Postgres via the Persistence Adapter
 * Layer. Also seeds the RBAC baseline (Roles, Permissions, a default
 * admin User) directly in Postgres, since no engine owns that data.
 *
 * Idempotent: guarded so it only seeds once per process, and every
 * Prisma write is an `upsert`, so re-running against an
 * already-seeded database is always safe.
 */
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { AppConfig } from '../config/index.js';
import { APP_CONFIG } from '../api/tokens.js';
import { mirrorAll, subscribeAll, type MirroredRuntimes } from '../adapters/index.js';
import type { BusinessDnaRuntime } from '@lateen-os/business-dna';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import type { FinanceRuntime } from '@lateen-os/finance-engine';
import type { HrRuntime } from '@lateen-os/hr-engine';
import type { InventoryRuntime } from '@lateen-os/inventory-engine';
import type { ProjectRuntime } from '@lateen-os/project-management-engine';
import { AuthorizationService } from '../security/authorization.service.js';
import { IdentityAdministrationService } from '../security/identity-administration.service.js';
import { DatabaseBootstrapService } from './database-bootstrap.service.js';
import { PrismaService } from './prisma.service.js';
import { setOrganizationId } from './organization-context.js';
import { RuntimeRegistryService } from '../runtime-registry/runtime-registry.service.js';

@Injectable()
export class SeedRunnerService implements OnModuleInit {
  private readonly logger = new Logger(SeedRunnerService.name);

  constructor(
    // Injected only to force Nest's dependency-based init ordering:
    // migrations must be applied before this service tries to write.
    private readonly databaseBootstrap: DatabaseBootstrapService,
    private readonly registry: RuntimeRegistryService,
    private readonly prisma: PrismaService,
    private readonly identityAdministration: IdentityAdministrationService,
    private readonly authorization: AuthorizationService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.prisma.connected) {
      this.logger.warn(
        'Database not connected — skipping seed. Real engines still run fully in-memory.',
      );
      return;
    }

    const businessDna = this.registry.get<BusinessDnaRuntime>('business-dna');
    const hr = this.registry.get<HrRuntime>('hr-engine');
    const crm = this.registry.get<CrmRuntime>('crm-engine');
    const inventory = this.registry.get<InventoryRuntime>('inventory-engine');
    const finance = this.registry.get<FinanceRuntime>('finance-engine');
    const projectManagement = this.registry.get<ProjectRuntime>('project-management-engine');

    if (!businessDna || !hr || !crm || !inventory || !finance || !projectManagement) {
      this.logger.warn('One or more required engines are not running — skipping seed.');
      return;
    }

    const organization = await businessDna.organization.create({
      code: 'ACME-SIGN',
      name: 'Acme Signage Co.',
      legalName: 'Acme Signage Company LLC',
      registrationNumber: 'REG-100200',
      taxId: 'TAX-100200',
      defaultCurrency: 'USD',
      defaultLocale: 'en-US',
      timezone: 'UTC',
    });
    const organizationId = organization.id;
    setOrganizationId(organizationId);

    await businessDna.businessProfile.upsert(organizationId, {
      displayName: organization.name,
      legalEntity: {
        legalName: organization.legalName,
        entityType: 'llc',
        registrationNumber: organization.registrationNumber,
        taxId: organization.taxId,
        countryOfIncorporation: 'US',
      },
    });

    await businessDna.products.createProduct(organizationId, {
      code: 'SIGN-CHANNEL-LTR',
      name: 'Illuminated Channel Letters',
      category: 'illuminated',
      productionType: 'fabrication',
      unitOfMeasure: 'each',
      currency: 'USD',
      basePrice: '850.00',
      costPrice: '410.00',
    });

    const department = await hr.organizationStructure.create(organizationId, {
      code: 'OPS',
      name: 'Operations',
      unitType: 'department',
    });
    const position = await hr.positions.create(organizationId, {
      title: 'Production Manager',
      departmentId: department.id,
      jobGrade: 'M1',
      salaryGrade: 'S3',
      baseSalary: '60000',
      currency: 'USD',
      headcount: 2,
    });
    await hr.employees.hire(organizationId, {
      firstName: 'Jordan',
      lastName: 'Reyes',
      email: 'jordan.reyes@acme-signage.example',
      departmentId: department.id,
      positionId: position.id,
      employmentType: 'full_time',
      baseSalary: '60000',
      currency: 'USD',
      hireDate: '2025-01-06',
    });

    const customer = await crm.customers.create(organizationId, {
      name: 'Northgate Retail Group',
      email: 'ap@northgate-retail.example',
      company: 'Northgate Retail Group',
      tags: ['retail'],
    });

    await inventory.warehouses.createWarehouse(organizationId, {
      code: 'WH-MAIN',
      name: 'Main Production Warehouse',
      address: '100 Industrial Way, Springfield',
    });

    await finance.chartOfAccounts.create(organizationId, {
      code: '1000',
      name: 'Cash',
      accountType: 'asset',
    });
    await finance.chartOfAccounts.create(organizationId, {
      code: '4000',
      name: 'Sales Revenue',
      accountType: 'revenue',
    });
    await finance.chartOfAccounts.create(organizationId, {
      code: '5100',
      name: 'Payroll Expense',
      accountType: 'expense',
    });

    await projectManagement.projects.create(organizationId, {
      code: 'PRJ-100',
      name: 'Northgate Storefront Signage Rollout',
      description:
        'Design, fabricate, and install channel-letter signage across 6 Northgate storefronts.',
      customerId: customer.id,
      startDate: '2026-02-02',
      targetEndDate: '2026-03-27',
    });

    const runtimes: MirroredRuntimes = {
      businessDna,
      hr,
      crm,
      inventory,
      finance,
      projectManagement,
    };
    await mirrorAll(this.prisma, runtimes, organizationId);
    this.logger.log(`Mirrored baseline seed data for organization ${organizationId}.`);

    subscribeAll(this.prisma, runtimes, organizationId);
    this.logger.log(
      'Persistence Adapter Layer subscribed to real engine events for live mirroring.',
    );

    await this.seedRbacBaseline(organizationId);
  }

  /**
   * RBAC baseline (Phase 4 Task 3). Users/Roles/Permissions are
   * genuinely new data with no *business* engine owner, but Admin
   * Console's real `IdentityAdministrationEngine` already exists to
   * administer exactly this bookkeeping — so it is created there first
   * (never reimplemented locally), then mirrored into Postgres for
   * durability, fast lookup, and the password/session data Admin Console
   * itself does not model. A matching Policy is registered with the
   * gateway's real Policy Evaluation engine for every permission code, so
   * `PermissionsGuard` always defers the allow/deny decision to
   * `AuthorizationService.evaluate()` rather than comparing lists itself.
   */
  private async seedRbacBaseline(organizationId: string): Promise<void> {
    const permissionCodes = [
      'platform:read',
      'platform:admin',
      'crm:read',
      'crm:write',
      'finance:read',
      'finance:write',
      'inventory:read',
      'inventory:write',
      'projects:read',
      'projects:write',
    ];

    for (const code of permissionCodes) {
      await this.identityAdministration.createPermission(organizationId, { code });
      await this.prisma.permission.upsert({ where: { code }, create: { code }, update: {} });
      await this.authorization.createPolicy(organizationId, {
        name: `permission:${code}`,
        effect: 'allow',
        resource: code,
        action: 'grant',
        principalScope: code,
        priority: 0,
      });
    }

    const adminGroup = await this.prisma.permissionGroup.upsert({
      where: { name: 'administrators' },
      create: { name: 'administrators', description: 'Full platform access' },
      update: {},
    });
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
    });
    for (const permission of permissions) {
      await this.prisma.permissionGroupPermission.upsert({
        where: {
          permissionGroupId_permissionId: {
            permissionGroupId: adminGroup.id,
            permissionId: permission.id,
          },
        },
        create: { permissionGroupId: adminGroup.id, permissionId: permission.id },
        update: {},
      });
    }

    const administeredRole = await this.identityAdministration.createRole(organizationId, {
      name: 'admin',
      permissionCodes,
    });
    const adminRole = await this.prisma.role.upsert({
      where: { organizationId_name: { organizationId, name: 'admin' } },
      create: { organizationId, name: 'admin', description: 'Administrator' },
      update: {},
    });
    await this.prisma.rolePermissionGroup.upsert({
      where: {
        roleId_permissionGroupId: { roleId: adminRole.id, permissionGroupId: adminGroup.id },
      },
      create: { roleId: adminRole.id, permissionGroupId: adminGroup.id },
      update: {},
    });

    const adminEmail = 'admin@acme-signage.example';
    const administeredUser = await this.identityAdministration.createUser(organizationId, {
      email: adminEmail,
      displayName: 'Platform Administrator',
    });
    if (administeredUser && administeredRole) {
      await this.identityAdministration.assignRole(
        organizationId,
        administeredUser.id,
        administeredRole.id,
      );
    }

    const passwordHash = await bcrypt.hash('ChangeMe123!', this.config.BCRYPT_SALT_ROUNDS);
    const adminUser = await this.prisma.user.upsert({
      where: { organizationId_email: { organizationId, email: adminEmail } },
      create: {
        organizationId,
        email: adminEmail,
        passwordHash,
        displayName: 'Platform Administrator',
      },
      update: {},
    });
    await this.prisma.roleAssignment.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      create: { userId: adminUser.id, roleId: adminRole.id },
      update: {},
    });

    this.logger.log(
      `Seeded RBAC baseline: 1 admin user, 1 role, 1 permission group, ${permissionCodes.length} permissions, ${permissionCodes.length} policies.`,
    );
  }
}
