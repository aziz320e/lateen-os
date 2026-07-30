import { randomUUID } from 'node:crypto';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { PERMISSION_KEY, ROLES_KEY } from '../src/auth/decorators.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../src/auth/guards/permissions.guard.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { PasswordService } from '../src/auth/password.service.js';
import { RbacService } from '../src/auth/rbac.service.js';
import { SessionService } from '../src/auth/session.service.js';
import { TokenService, type AccessTokenPayload } from '../src/auth/token.service.js';
import { loadConfig, type AppConfig } from '../src/config/index.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';
import { AuditService } from '../src/security/audit.service.js';
import { AuthenticationService } from '../src/security/authentication.service.js';
import { AuthorizationService } from '../src/security/authorization.service.js';

/**
 * A minimal in-memory fake Prisma double, covering only the models and
 * methods the auth flow actually touches. No live PostgreSQL exists in
 * this environment (see `tests/database.test.ts`), so — exactly like
 * `tests/adapters.test.ts` — only Prisma itself is faked; every other
 * component (JWT engine, Policy Evaluation engine, Audit service) is the
 * real, hosted runtime.
 */
function createFakePrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const refreshTokens = new Map<string, any>();
  const roleAssignments: any[] = [];

  return {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.id) return users.get(where.id) ?? null;
        if (where.organizationId_email) {
          const { organizationId, email } = where.organizationId_email;
          return (
            [...users.values()].find(
              (u) => u.organizationId === organizationId && u.email === email,
            ) ?? null
          );
        }
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const user = { id: randomUUID(), status: 'active', ...data };
        users.set(user.id, user);
        return user;
      }),
    },
    session: {
      create: vi.fn(async ({ data }: any) => {
        const session = { id: randomUUID(), createdAt: new Date(), revokedAt: null, ...data };
        sessions.set(session.id, session);
        return session;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const session = sessions.get(where.id);
        Object.assign(session, data);
        return session;
      }),
    },
    refreshToken: {
      create: vi.fn(async ({ data }: any) => {
        const token = {
          id: randomUUID(),
          createdAt: new Date(),
          revokedAt: null,
          replacedByTokenId: null,
          ...data,
        };
        refreshTokens.set(token.id, token);
        return token;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        const token = [...refreshTokens.values()].find(
          (candidate) => candidate.tokenHash === where.tokenHash,
        );
        if (!token) return null;
        const session = sessions.get(token.sessionId);
        const user = users.get(session.userId);
        return { ...token, session: { ...session, user } };
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const token = refreshTokens.get(where.id);
        Object.assign(token, data);
        return token;
      }),
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const token of refreshTokens.values()) {
          if (token.sessionId === where.sessionId && token.revokedAt === where.revokedAt) {
            Object.assign(token, data);
            count += 1;
          }
        }
        return { count };
      }),
    },
    roleAssignment: {
      findMany: vi.fn(async ({ where }: any) =>
        roleAssignments.filter((assignment) => assignment.userId === where.userId),
      ),
    },
    $transaction: vi.fn(async (ops: readonly Promise<unknown>[]) => Promise.all(ops)),
    _seedRoleAssignment(assignment: unknown) {
      roleAssignments.push(assignment);
    },
  } as any;
}

function makeContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({}) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('Task 3 — Authentication & Authorization', () => {
  let config: AppConfig;
  let registry: RuntimeRegistryService;
  let authentication: AuthenticationService;
  let authorization: AuthorizationService;
  let audit: AuditService;
  let tokens: TokenService;
  let organizationId: string;

  beforeAll(async () => {
    config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    registry = new RuntimeRegistryService();
    registry.onModuleInit();
    authentication = new AuthenticationService(registry);
    authorization = new AuthorizationService(registry);
    audit = new AuditService(registry);
    tokens = new TokenService(authentication, config);

    organizationId = 'org-task3-test';
    await authorization.createPolicy(organizationId, {
      name: 'permission:finance:write',
      effect: 'allow',
      resource: 'finance:write',
      action: 'grant',
      principalScope: 'finance:write',
      priority: 0,
    });
  });

  describe('Protected endpoint (JwtAuthGuard)', () => {
    it('allows a request bearing a real, valid access token and attaches the decoded principal', () => {
      const token = tokens.issueAccessToken({
        sub: 'user-1',
        organizationId,
        roles: ['admin'],
        permissions: ['finance:write'],
      });
      const request: {
        cookies: Record<string, string>;
        headers: Record<string, string>;
        user?: AccessTokenPayload;
      } = {
        cookies: { lateen_access_token: token! },
        headers: {},
      };
      const guard = new JwtAuthGuard(tokens);
      expect(guard.canActivate(makeContext(request))).toBe(true);
      expect(request.user?.sub).toBe('user-1');
      expect(request.user?.roles).toEqual(['admin']);
    });

    it('rejects a request with no access token', () => {
      const request = { cookies: {}, headers: {} };
      const guard = new JwtAuthGuard(tokens);
      expect(() => guard.canActivate(makeContext(request))).toThrow(UnauthorizedException);
    });
  });

  describe('Expired token validation', () => {
    it('rejects an access token whose TTL has already elapsed', () => {
      const expiredConfig = loadConfig({
        NODE_ENV: 'test',
        ACCESS_TOKEN_TTL_SECONDS: '-5',
      } as NodeJS.ProcessEnv);
      const expiredTokens = new TokenService(authentication, expiredConfig);
      const token = expiredTokens.issueAccessToken({
        sub: 'user-1',
        organizationId,
        roles: [],
        permissions: [],
      });

      expect(expiredTokens.verifyAccessToken(token!)).toBeNull();

      const guard = new JwtAuthGuard(expiredTokens);
      const request = { cookies: { lateen_access_token: token! }, headers: {} };
      expect(() => guard.canActivate(makeContext(request))).toThrow(UnauthorizedException);
    });
  });

  describe('Role validation (RolesGuard)', () => {
    it('allows a user holding one of the required roles', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['admin']),
      } as unknown as Reflector;
      const request = {
        user: { sub: 'user-1', organizationId, roles: ['admin'], permissions: [] },
      };
      const guard = new RolesGuard(reflector);
      expect(guard.canActivate(makeContext(request))).toBe(true);
    });

    it('rejects a user missing every required role', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(['admin']),
      } as unknown as Reflector;
      const request = {
        user: { sub: 'user-1', organizationId, roles: ['viewer'], permissions: [] },
      };
      const guard = new RolesGuard(reflector);
      expect(() => guard.canActivate(makeContext(request))).toThrow(ForbiddenException);
    });

    it('allows any user when no roles are required', () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue(undefined),
      } as unknown as Reflector;
      const request = { user: { sub: 'user-1', organizationId, roles: [], permissions: [] } };
      const guard = new RolesGuard(reflector);
      expect(guard.canActivate(makeContext(request))).toBe(true);
    });
  });

  describe('Permission validation (PermissionsGuard) — decision delegated to the real Policy Evaluation engine', () => {
    it('allows a user whose permission scopes match a registered policy', async () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue('finance:write'),
      } as unknown as Reflector;
      const request = {
        user: { sub: 'user-1', organizationId, roles: [], permissions: ['finance:write'] },
      };
      const guard = new PermissionsGuard(reflector, authorization);
      await expect(guard.canActivate(makeContext(request))).resolves.toBe(true);
    });

    it('rejects a user lacking the required permission', async () => {
      const reflector = {
        getAllAndOverride: vi.fn().mockReturnValue('finance:write'),
      } as unknown as Reflector;
      const request = { user: { sub: 'user-1', organizationId, roles: [], permissions: [] } };
      const guard = new PermissionsGuard(reflector, authorization);
      await expect(guard.canActivate(makeContext(request))).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Login, Refresh flow, and Logout (AuthService, RBAC-aware)', () => {
    it('logs in, rotates the refresh token twice, and revokes the session at logout', async () => {
      const prisma = createFakePrisma();
      const password = new PasswordService(config);
      const authTokens = new TokenService(authentication, config);
      const sessions = new SessionService(prisma, authTokens, config);
      const rbac = new RbacService(prisma);
      const authService = new AuthService(prisma, password, authTokens, sessions, rbac, audit);

      const passwordHash = await password.hash('Secret123!');
      const user = await prisma.user.create({
        data: { organizationId, email: 'jane@example.com', passwordHash, displayName: 'Jane Doe' },
      });
      prisma._seedRoleAssignment({
        userId: user.id,
        role: {
          name: 'finance-admin',
          permissionGroups: [
            { permissionGroup: { permissions: [{ permission: { code: 'finance:write' } }] } },
          ],
        },
      });

      await expect(
        authService.login(
          { organizationId, email: 'jane@example.com', password: 'wrong-password' },
          {},
        ),
      ).rejects.toThrow(UnauthorizedException);

      const loginResult = await authService.login(
        { organizationId, email: 'jane@example.com', password: 'Secret123!' },
        { userAgent: 'vitest' },
      );
      expect(loginResult.accessToken).toBeTruthy();
      expect(loginResult.refreshToken).toBeTruthy();
      expect(loginResult.roles).toContain('finance-admin');
      expect(loginResult.permissions).toContain('finance:write');

      const firstRefresh = await authService.refresh(organizationId, loginResult.refreshToken);
      expect(firstRefresh.accessToken).toBeTruthy();
      expect(firstRefresh.refreshToken).not.toBe(loginResult.refreshToken);

      // The original refresh token was rotated away and must no longer work.
      await expect(authService.refresh(organizationId, loginResult.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );

      const secondRefresh = await authService.refresh(organizationId, firstRefresh.refreshToken);
      expect(secondRefresh.refreshToken).not.toBe(firstRefresh.refreshToken);

      const profile = await authService.me(user.id);
      expect(profile?.email).toBe('jane@example.com');

      await authService.logout(organizationId, secondRefresh.refreshToken);
      await expect(authService.refresh(organizationId, secondRefresh.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
