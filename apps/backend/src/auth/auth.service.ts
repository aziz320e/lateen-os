/**
 * Authentication & Authorization orchestration for Login, Logout,
 * Refresh, and `/auth/me`. Every credential/session concern (password
 * hashing, JWT issuance, session/refresh-token persistence) delegates to
 * its own dedicated service — this only sequences them and records the
 * outcome to the real AI Security Engine audit trail.
 */
import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { AuditService } from '../security/audit.service.js';
import { PasswordService } from './password.service.js';
import { RbacService } from './rbac.service.js';
import { SessionService, type SessionMeta } from './session.service.js';
import { TokenService } from './token.service.js';

export interface LoginInput {
  readonly organizationId: string;
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: { readonly id: string; readonly email: string; readonly displayName: string };
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly password: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionService,
    private readonly rbac: RbacService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Every public method below touches Postgres (Users/Sessions/RefreshTokens
   * have no business-engine owner — see `prisma/schema.prisma`'s OWNED
   * tables note). `PrismaService` itself never crashes the process when
   * Postgres is unreachable, but an individual query still throws. Any
   * exception that escapes an operation here is therefore always an
   * infrastructure failure, never a deliberate auth decision (those are
   * already `HttpException`s thrown explicitly, e.g. `UnauthorizedException`
   * below) — so it is reported as 503, matching how `DatabaseHealthService`
   * already reports "database unreachable" as a real, distinct condition
   * rather than letting a generic 500 reach the caller.
   */
  private async withDatabase<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new ServiceUnavailableException('Authentication service is temporarily unavailable.');
    }
  }

  async login(input: LoginInput, meta: SessionMeta): Promise<AuthenticatedSession> {
    return this.withDatabase(() => this.loginUnsafe(input, meta));
  }

  private async loginUnsafe(input: LoginInput, meta: SessionMeta): Promise<AuthenticatedSession> {
    const user = await this.prisma.user.findUnique({
      where: { organizationId_email: { organizationId: input.organizationId, email: input.email } },
    });

    const passwordOk = user ? await this.password.verify(input.password, user.passwordHash) : false;
    if (!user || !passwordOk || user.status !== 'active') {
      await this.audit.record(input.organizationId, {
        category: 'authentication',
        action: 'login',
        actorId: user?.id,
        outcome: 'failure',
        details: {
          reason: !user
            ? 'not_found'
            : user.status !== 'active'
              ? 'inactive'
              : 'invalid_credentials',
        },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    const { roles, permissions } = await this.rbac.loadProfile(user.id);
    const accessToken = this.tokens.issueAccessToken({
      sub: user.id,
      organizationId: input.organizationId,
      roles,
      permissions,
    });
    if (!accessToken) throw new UnauthorizedException('Authentication engine unavailable.');

    const { sessionId, refreshToken } = await this.sessions.create(user.id, meta);

    await this.audit.record(input.organizationId, {
      category: 'authentication',
      action: 'login',
      actorId: user.id,
      outcome: 'success',
      details: { sessionId },
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, displayName: user.displayName },
      roles,
      permissions,
    };
  }

  async logout(organizationId: string, rawRefreshToken: string): Promise<void> {
    return this.withDatabase(() => this.logoutUnsafe(organizationId, rawRefreshToken));
  }

  private async logoutUnsafe(organizationId: string, rawRefreshToken: string): Promise<void> {
    const refreshToken = await this.sessions.findValid(rawRefreshToken);
    if (!refreshToken) return;
    await this.sessions.revoke(refreshToken.sessionId);
    await this.audit.record(organizationId, {
      category: 'authentication',
      action: 'logout',
      actorId: refreshToken.session.userId,
      outcome: 'success',
      details: { sessionId: refreshToken.sessionId },
    });
  }

  /**
   * The organization is deliberately not a parameter here — it is always
   * read from the refresh token's own session/user record
   * (`refreshToken.session.user.organizationId`), never from caller input.
   * A refresh token is only ever valid for the organization it was issued
   * under; trusting a caller-supplied organization would let a valid
   * refresh token from one organization mint an access token for another.
   */
  async refresh(rawRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return this.withDatabase(() => this.refreshUnsafe(rawRefreshToken));
  }

  private async refreshUnsafe(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await this.sessions.findValid(rawRefreshToken);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const user = refreshToken.session.user;
    const { roles, permissions } = await this.rbac.loadProfile(user.id);
    const accessToken = this.tokens.issueAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      roles,
      permissions,
    });
    if (!accessToken) throw new UnauthorizedException('Authentication engine unavailable.');

    const newRefreshToken = await this.sessions.rotate(refreshToken.id, refreshToken.sessionId);

    await this.audit.record(user.organizationId, {
      category: 'authentication',
      action: 'refresh',
      actorId: user.id,
      outcome: 'success',
      details: { sessionId: refreshToken.sessionId },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async me(userId: string): Promise<{
    id: string;
    email: string;
    displayName: string;
    roles: readonly string[];
    permissions: readonly string[];
  } | null> {
    return this.withDatabase(() => this.meUnsafe(userId));
  }

  private async meUnsafe(userId: string): Promise<{
    id: string;
    email: string;
    displayName: string;
    roles: readonly string[];
    permissions: readonly string[];
  } | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const { roles, permissions } = await this.rbac.loadProfile(userId);
    return { id: user.id, email: user.email, displayName: user.displayName, roles, permissions };
  }
}
