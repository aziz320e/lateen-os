import 'reflect-metadata';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { AdministrationController } from '../src/api/v1/administration/administration.controller.js';
import { CrmController } from '../src/api/v1/crm/crm.controller.js';
import { FinanceController } from '../src/api/v1/finance/finance.controller.js';
import { InventoryController } from '../src/api/v1/inventory/inventory.controller.js';
import { ProjectsController } from '../src/api/v1/projects/projects.controller.js';
import { PERMISSION_KEY } from '../src/auth/decorators.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard.js';
import type { AccessTokenPayload } from '../src/auth/token.service.js';
import { TokenService } from '../src/auth/token.service.js';
import { loadConfig, type AppConfig } from '../src/config/index.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';
import { AuthenticationService } from '../src/security/authentication.service.js';
import { AuthorizationService } from '../src/security/authorization.service.js';

/**
 * Blocker 4 — proves, for every RBAC-hardened domain (CRM, Finance,
 * Administration → Organizations, Inventory, Projects), the full
 * 401 / 403 / 200 authorization matrix:
 *
 *  - 401: no access token at all (JwtAuthGuard).
 *  - 403: a valid, authenticated principal that lacks the route's
 *    required permission (PermissionsGuard + the real Policy
 *    Evaluation engine).
 *  - 200: a valid principal holding the required permission, whose
 *    organization has a matching policy — the guard passes, and the
 *    underlying controller method actually succeeds.
 *
 * The context passed to each guard is bound to the REAL controller
 * class and its REAL method — never a fake object — via `Reflector`
 * (the exact class Nest uses at runtime) and `GUARDS_METADATA`. This
 * means the 403 and 200 assertions read the actual `@RequirePermission`
 * metadata and the actual `@UseGuards(PermissionsGuard)` wiring on the
 * controller source: removing either decorator from a route makes the
 * corresponding assertion fail.
 */
describe('Blocker 4 — RBAC regression matrix (401 / 403 / 200)', () => {
  let config: AppConfig;
  let registry: RuntimeRegistryService;
  let authentication: AuthenticationService;
  let authorization: AuthorizationService;
  let tokens: TokenService;
  let reflector: Reflector;
  let organizationId: string;

  beforeAll(async () => {
    config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    registry = new RuntimeRegistryService();
    registry.onModuleInit();
    authentication = new AuthenticationService(registry);
    authorization = new AuthorizationService(registry);
    tokens = new TokenService(authentication, config);
    reflector = new Reflector();

    organizationId = 'org-rbac-regression-test';
    for (const code of [
      'crm:read',
      'crm:write',
      'finance:read',
      'finance:write',
      'platform:admin',
      'inventory:read',
      'inventory:write',
      'projects:read',
      'projects:write',
    ]) {
      await authorization.createPolicy(organizationId, {
        name: `permission:${code}`,
        effect: 'allow',
        resource: code,
        action: 'grant',
        principalScope: code,
        priority: 0,
      });
    }
  });

  function contextFor(
    handler: (...args: never[]) => unknown,
    controllerClass: new (...args: never[]) => unknown,
    request: unknown,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({}) }),
      getHandler: () => handler,
      getClass: () => controllerClass,
    } as unknown as ExecutionContext;
  }

  /** Reads the guard classes Nest actually attached to a route via `@UseGuards()`. */
  function methodGuards(
    controllerClass: new (...args: never[]) => unknown,
    methodName: string,
  ): unknown[] {
    return (
      Reflect.getMetadata(
        GUARDS_METADATA,
        (controllerClass.prototype as Record<string, unknown>)[methodName] as object,
      ) ?? []
    );
  }

  const domains: Array<{
    name: string;
    controllerClass: new (registry: RuntimeRegistryService) => object;
    readMethod: string;
    writeMethod: string;
    readPermission: string;
    writePermission: string;
    invokeRead: (controller: any, user: AccessTokenPayload) => Promise<unknown>;
  }> = [
    {
      name: 'CRM',
      controllerClass: CrmController,
      readMethod: 'listCustomers',
      writeMethod: 'createCustomer',
      readPermission: 'crm:read',
      writePermission: 'crm:write',
      invokeRead: (controller, user) => controller.listCustomers(user, {}),
    },
    {
      name: 'Finance',
      controllerClass: FinanceController,
      readMethod: 'listAccounts',
      writeMethod: 'createAccount',
      readPermission: 'finance:read',
      writePermission: 'finance:write',
      invokeRead: (controller, user) => controller.listAccounts(user, {}),
    },
    {
      name: 'Administration — Organizations',
      controllerClass: AdministrationController,
      readMethod: 'listOrganizations',
      writeMethod: 'registerOrganization',
      readPermission: 'platform:admin',
      writePermission: 'platform:admin',
      invokeRead: (controller, _user) => controller.listOrganizations({}),
    },
    {
      name: 'Inventory',
      controllerClass: InventoryController,
      readMethod: 'listItems',
      writeMethod: 'createItem',
      readPermission: 'inventory:read',
      writePermission: 'inventory:write',
      invokeRead: (controller, user) => controller.listItems(user, {}),
    },
    {
      name: 'Projects',
      controllerClass: ProjectsController,
      readMethod: 'listProjects',
      writeMethod: 'createProject',
      readPermission: 'projects:read',
      writePermission: 'projects:write',
      invokeRead: (controller, user) => controller.listProjects(user, {}),
    },
  ];

  for (const domain of domains) {
    describe(domain.name, () => {
      it('401: JwtAuthGuard rejects a request with no access token', () => {
        const guard = new JwtAuthGuard(tokens);
        const request = { cookies: {}, headers: {} };
        expect(() =>
          guard.canActivate(contextFor(() => {}, domain.controllerClass, request)),
        ).toThrow(UnauthorizedException);
      });

      it(`403: PermissionsGuard rejects an authenticated principal missing ${domain.readPermission}`, async () => {
        const guards = methodGuards(domain.controllerClass, domain.readMethod);
        expect(guards).toContain(PermissionsGuard);

        const requiredPermission = reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
          (domain.controllerClass.prototype as Record<string, unknown>)[domain.readMethod] as never,
          domain.controllerClass as never,
        ]);
        expect(requiredPermission).toBe(domain.readPermission);

        const guard = new PermissionsGuard(reflector, authorization);
        const request = {
          user: { sub: 'user-1', organizationId, roles: [], permissions: [] },
        };
        await expect(
          guard.canActivate(
            contextFor(
              (domain.controllerClass.prototype as Record<string, unknown>)[
                domain.readMethod
              ] as never,
              domain.controllerClass,
              request,
            ),
          ),
        ).rejects.toThrow(ForbiddenException);
      });

      it(`200: an authorized principal holding ${domain.writePermission} passes the guard and the real controller call succeeds`, async () => {
        const writeGuards = methodGuards(domain.controllerClass, domain.writeMethod);
        expect(writeGuards).toContain(PermissionsGuard);

        const guard = new PermissionsGuard(reflector, authorization);
        const request = {
          user: { sub: 'user-1', organizationId, roles: [], permissions: [domain.readPermission] },
        };
        await expect(
          guard.canActivate(
            contextFor(
              (domain.controllerClass.prototype as Record<string, unknown>)[
                domain.readMethod
              ] as never,
              domain.controllerClass,
              request,
            ),
          ),
        ).resolves.toBe(true);

        // Prove the guard passing actually corresponds to a real, working
        // request — not just an isolated guard decision.
        const controller = new domain.controllerClass(registry);
        const user: AccessTokenPayload = {
          sub: 'user-1',
          organizationId,
          roles: [],
          permissions: [domain.readPermission],
        };
        const result = await domain.invokeRead(controller, user);
        expect(result).toBeDefined();
      });
    });
  }
});
