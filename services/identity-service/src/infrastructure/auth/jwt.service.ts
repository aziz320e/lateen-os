import { SignJWT, jwtVerify } from 'jose';
import type { AppConfig } from '../../config/index';
import type { AuthContext, TokenService } from '../../domain/ports';

export class JwtTokenService implements TokenService {
  private readonly secret: Uint8Array;

  constructor(private readonly config: AppConfig) {
    this.secret = new TextEncoder().encode(config.JWT_SECRET);
  }

  async issueAccessToken(context: AuthContext): Promise<string> {
    return new SignJWT({
      sub: context.subject,
      subjectType: context.subjectType,
      organizationId: context.organizationId,
      roles: context.roles,
      permissions: context.permissions,
      sessionId: context.sessionId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('lateen-identity')
      .setAudience('lateen-os')
      .setExpirationTime(`${this.config.JWT_ACCESS_TTL_SECONDS}s`)
      .sign(this.secret);
  }

  async verifyAccessToken(token: string): Promise<AuthContext | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'lateen-identity',
        audience: 'lateen-os',
      });
      const organizationId = payload.organizationId as string | undefined;
      const subject = payload.sub;
      if (!organizationId || !subject) return null;
      return {
        subject,
        subjectType: (payload.subjectType as AuthContext['subjectType']) ?? 'user',
        organizationId,
        roles: (payload.roles as string[]) ?? [],
        permissions: (payload.permissions as string[]) ?? [],
        sessionId: payload.sessionId as string | undefined,
      };
    } catch {
      return null;
    }
  }

  issueRefreshToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Buffer.from(bytes).toString('base64url');
  }
}
