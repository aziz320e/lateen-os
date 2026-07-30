/** Protects a route: verifies the real HS256 access-token JWT (cookie or `Authorization: Bearer`) and attaches the decoded principal to the request. */
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AccessTokenPayload } from '../token.service.js';
import { TokenService } from '../token.service.js';

const ACCESS_TOKEN_COOKIE = 'lateen_access_token';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AccessTokenPayload }>();
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE] ?? this.bearerToken(request);
    if (!token) throw new UnauthorizedException('No access token presented.');

    const payload = this.tokens.verifyAccessToken(token);
    if (!payload) throw new UnauthorizedException('Access token is invalid or expired.');

    request.user = payload;
    return true;
  }

  private bearerToken(request: FastifyRequest): string | undefined {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice('Bearer '.length);
  }
}
