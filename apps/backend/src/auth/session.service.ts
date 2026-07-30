/** Session Management — creates, rotates, and revokes Sessions and Refresh Tokens in Postgres (the durable store for this host-owned concern; no engine owns session/credential state). */
import { Inject, Injectable } from '@nestjs/common';
import type { AppConfig } from '../config/index.js';
import { APP_CONFIG } from '../api/tokens.js';
import { PrismaService } from '../database/prisma.service.js';
import { TokenService } from './token.service.js';

export interface SessionMeta {
  readonly userAgent?: string;
  readonly ipAddress?: string;
}

export interface IssuedSession {
  readonly sessionId: string;
  readonly refreshToken: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  private refreshExpiry(): Date {
    return new Date(Date.now() + this.config.REFRESH_TOKEN_TTL_SECONDS * 1000);
  }

  /** Creates a new Session plus its first Refresh Token — the start of a login. */
  async create(userId: string, meta: SessionMeta): Promise<IssuedSession> {
    const session = await this.prisma.session.create({
      data: {
        userId,
        expiresAt: this.refreshExpiry(),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    });
    const { raw, hash } = this.tokens.issueRefreshSecret();
    await this.prisma.refreshToken.create({
      data: { sessionId: session.id, tokenHash: hash, expiresAt: this.refreshExpiry() },
    });
    return { sessionId: session.id, refreshToken: raw };
  }

  /** Looks up a live (not revoked, not expired) refresh token by its raw value, along with its session and user. */
  async findValid(rawRefreshToken: string) {
    const tokenHash = this.tokens.hashRefreshSecret(rawRefreshToken);
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: { include: { user: true } } },
    });
    if (!refreshToken) return null;
    if (refreshToken.revokedAt) return null;
    if (refreshToken.expiresAt <= new Date()) return null;
    if (refreshToken.session.revokedAt) return null;
    if (refreshToken.session.expiresAt <= new Date()) return null;
    return refreshToken;
  }

  /** Refresh Token Rotation: revokes the presented token, chains it to a freshly issued replacement, and extends the session. */
  async rotate(currentTokenId: string, sessionId: string): Promise<string> {
    const { raw, hash } = this.tokens.issueRefreshSecret();
    const replacement = await this.prisma.refreshToken.create({
      data: { sessionId, tokenHash: hash, expiresAt: this.refreshExpiry() },
    });
    await this.prisma.refreshToken.update({
      where: { id: currentTokenId },
      data: { revokedAt: new Date(), replacedByTokenId: replacement.id },
    });
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: this.refreshExpiry() },
    });
    return raw;
  }

  /** Revokes a session and every refresh token issued under it — used at logout. */
  async revoke(sessionId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: now } }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }
}
