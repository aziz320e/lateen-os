import type { AppConfig } from '../config/index';
import { IDENTITY_EVENT_NAMES } from '../domain/types';
import type {
  AuditLogger,
  AuthorizationProvider,
  IdentityEventPublisher,
  KeycloakAdapter,
  PasswordHasher,
  RateLimiter,
  TokenService,
} from '../domain/ports';
import type { AuthContext, LoginRequest, RefreshRequest, TokenPair } from '../domain/types';
import { createDomainEvent } from '../events/nats-publisher';
import { generateSecureToken, hashToken } from '../infrastructure/auth/password-hasher';
import { isIpAllowed } from '../infrastructure/auth/password-policy';
import type { IdentityRepositories } from '../repositories/identity-repositories';

export class AuthService {
  constructor(
    private readonly repos: IdentityRepositories,
    private readonly config: AppConfig,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly keycloak: KeycloakAdapter,
    private readonly authorization: AuthorizationProvider,
    private readonly rateLimiter: RateLimiter,
    private readonly audit: AuditLogger,
    private readonly events: IdentityEventPublisher,
  ) {}

  async login(request: LoginRequest): Promise<TokenPair & { user: Record<string, unknown> }> {
    if (!isIpAllowed(request.ipAddress, this.config.ALLOWED_IP_CIDRS)) {
      throw new Error('IP address not allowed');
    }

    const rateKey = `login:${request.organizationId}:${request.username}:${request.ipAddress ?? 'unknown'}`;
    const rate = await this.rateLimiter.check(rateKey, this.config.RATE_LIMIT_MAX, this.config.RATE_LIMIT_WINDOW_SECONDS);
    if (!rate.allowed) throw new Error('Rate limit exceeded');

    const org = await this.repos.organizationIdentity.findFirst({
      where: { organizationId: request.organizationId },
    });
    if (!org) throw new Error('Organization not found');

    const user = await this.repos.user.findFirst({
      where: { organizationId: org.id, OR: [{ username: request.username }, { email: request.username }] },
    });
    if (!user || user.status !== 'active') throw new Error('Invalid credentials');

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('Account locked');
    }

    if (this.config.KEYCLOAK_ENABLED) {
      const kcTokens = await this.keycloak.exchangePassword(request.username, request.password);
      if (kcTokens) {
        await this.recordLogin(user.id, org.organizationId, request, kcTokens.refreshToken);
        await this.events.publish(
          createDomainEvent(IDENTITY_EVENT_NAMES.UserLoggedIn, { userId: user.id, via: 'keycloak' }, org.organizationId),
        );
        return { ...kcTokens, user: this.toUserDto(user, org.organizationId) };
      }
    }

    if (!user.passwordHash || !(await this.passwordHasher.verify(request.password, user.passwordHash))) {
      await this.recordFailedLogin(user.id, org.organizationId, request);
      throw new Error('Invalid credentials');
    }

    const roles = (user.roles as string[]) ?? [];
    const permissions = (user.permissions as string[]) ?? [];
    const bdsAuth = await this.authorization.loadRolesAndPermissions(org.organizationId, user.id);
    const mergedRoles = [...new Set([...roles, ...bdsAuth.roles])];
    const mergedPerms = [...new Set([...permissions, ...bdsAuth.permissions])];

    const sessionToken = generateSecureToken();
    const refreshTokenRaw = this.tokenService.issueRefreshToken();
    const ttl = request.rememberMe ? this.config.JWT_REMEMBER_ME_TTL_SECONDS : this.config.JWT_REFRESH_TTL_SECONDS;

    const session = await this.repos.session.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        tokenHash: hashToken(sessionToken),
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        rememberMe: request.rememberMe ?? false,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    await this.repos.refreshToken.create({
      data: {
        userId: user.id,
        sessionId: session.id,
        organizationId: org.id,
        tokenHash: hashToken(refreshTokenRaw),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    if (request.deviceId) {
      await this.repos.device.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId: request.deviceId } },
        create: {
          userId: user.id,
          organizationId: org.id,
          deviceId: request.deviceId,
          name: request.deviceName,
          lastSeenAt: new Date(),
        },
        update: { lastSeenAt: new Date(), name: request.deviceName ?? undefined },
      });
    }

    await this.repos.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const authContext: AuthContext = {
      subject: user.id,
      subjectType: 'user',
      organizationId: org.organizationId,
      roles: mergedRoles,
      permissions: mergedPerms,
      sessionId: session.id,
    };

    const accessToken = await this.tokenService.issueAccessToken(authContext);

    await this.audit.log({
      organizationId: org.organizationId,
      actorSubject: user.id,
      action: 'login',
      resource: 'session',
      resourceId: session.id,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      outcome: 'success',
    });

    await this.events.publish(
      createDomainEvent(IDENTITY_EVENT_NAMES.UserLoggedIn, { userId: user.id, sessionId: session.id }, org.organizationId),
    );

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: this.config.JWT_ACCESS_TTL_SECONDS,
      tokenType: 'Bearer',
      user: this.toUserDto(user, org.organizationId, mergedRoles, mergedPerms),
    };
  }

  async refresh(request: RefreshRequest): Promise<TokenPair> {
    const tokenHash = hashToken(request.refreshToken);
    const stored = await this.repos.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
      include: { user: true, session: true },
    });

    if (!stored || stored.expiresAt < new Date() || stored.session.revokedAt) {
      if (stored) {
        await this.events.publish(
          createDomainEvent(IDENTITY_EVENT_NAMES.SessionExpired, { sessionId: stored.sessionId }, stored.organizationId),
        );
      }
      throw new Error('Invalid or expired refresh token');
    }

    if (this.config.KEYCLOAK_ENABLED) {
      const kcTokens = await this.keycloak.refresh(request.refreshToken);
      if (kcTokens) return kcTokens;
    }

    const org = await this.repos.organizationIdentity.findUnique({ where: { id: stored.organizationId } });
    if (!org) throw new Error('Organization not found');

    const roles = (stored.user.roles as string[]) ?? [];
    const permissions = (stored.user.permissions as string[]) ?? [];
    const bdsAuth = await this.authorization.loadRolesAndPermissions(org.organizationId, stored.user.id);

    const authContext: AuthContext = {
      subject: stored.user.id,
      subjectType: 'user',
      organizationId: org.organizationId,
      roles: [...new Set([...roles, ...bdsAuth.roles])],
      permissions: [...new Set([...permissions, ...bdsAuth.permissions])],
      sessionId: stored.sessionId,
    };

    const accessToken = await this.tokenService.issueAccessToken(authContext);
    const newRefresh = this.tokenService.issueRefreshToken();
    const ttl = stored.session.rememberMe ? this.config.JWT_REMEMBER_ME_TTL_SECONDS : this.config.JWT_REFRESH_TTL_SECONDS;

    await this.repos.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await this.repos.refreshToken.create({
      data: {
        userId: stored.userId,
        sessionId: stored.sessionId,
        organizationId: stored.organizationId,
        tokenHash: hashToken(newRefresh),
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    return {
      accessToken,
      refreshToken: newRefresh,
      expiresIn: this.config.JWT_ACCESS_TTL_SECONDS,
      tokenType: 'Bearer',
    };
  }

  async logout(refreshToken: string, actorSubject: string, ipAddress?: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.repos.refreshToken.findFirst({
      where: { tokenHash },
      include: { session: true },
    });

    if (stored) {
      await this.repos.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      await this.repos.session.update({ where: { id: stored.sessionId }, data: { revokedAt: new Date() } });

      const org = await this.repos.organizationIdentity.findUnique({ where: { id: stored.organizationId } });
      await this.events.publish(
        createDomainEvent(
          IDENTITY_EVENT_NAMES.UserLoggedOut,
          { userId: stored.userId, sessionId: stored.sessionId },
          org?.organizationId,
        ),
      );
    }

    if (this.config.KEYCLOAK_ENABLED) {
      await this.keycloak.logout(refreshToken);
    }

    await this.audit.log({
      actorSubject,
      action: 'logout',
      resource: 'session',
      resourceId: stored?.sessionId,
      ipAddress,
      outcome: 'success',
    });
  }

  async me(accessToken: string): Promise<Record<string, unknown>> {
    if (this.config.KEYCLOAK_ENABLED) {
      const kcContext = await this.keycloak.introspect(accessToken);
      if (kcContext) {
        return {
          subject: kcContext.subject,
          organizationId: kcContext.organizationId,
          roles: kcContext.roles,
          permissions: kcContext.permissions,
          authProvider: 'keycloak',
        };
      }
    }

    const context = await this.tokenService.verifyAccessToken(accessToken);
    if (!context) throw new Error('Invalid token');

    const user = await this.repos.user.findUnique({ where: { id: context.subject } });
    if (!user) throw new Error('User not found');

    return this.toUserDto(user, context.organizationId, [...context.roles], [...context.permissions]);
  }

  private async recordFailedLogin(userId: string, bdsOrgId: string, request: LoginRequest) {
    const user = await this.repos.user.update({
      where: { id: userId },
      data: { failedAttempts: { increment: 1 } },
    });

    if (user.failedAttempts >= this.config.MAX_LOGIN_ATTEMPTS) {
      await this.repos.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + this.config.LOCKOUT_DURATION_SECONDS * 1000) },
      });
    }

    await this.audit.log({
      organizationId: bdsOrgId,
      actorSubject: userId,
      action: 'login',
      resource: 'session',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      outcome: 'failure',
    });
  }

  private async recordLogin(userId: string, orgId: string, request: LoginRequest, _refreshToken: string) {
    await this.repos.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), failedAttempts: 0, lockedUntil: null },
    });
    await this.audit.log({
      organizationId: orgId,
      actorSubject: userId,
      action: 'login',
      resource: 'session',
      ipAddress: request.ipAddress,
      outcome: 'success',
      metadata: { provider: 'keycloak' },
    });
  }

  private toUserDto(
    user: { id: string; email: string; username: string; displayName: string | null; status: string },
    organizationId: string,
    roles: string[] = [],
    permissions: string[] = [],
  ) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      status: user.status,
      organizationId,
      roles,
      permissions,
    };
  }
}
