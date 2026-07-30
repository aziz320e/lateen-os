/** Role validation — requires the authenticated user (attached by `JwtAuthGuard`, which must run first) to hold at least one of the roles declared via `@Roles(...)`. */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { AccessTokenPayload } from '../token.service.js';
import { ROLES_KEY } from '../decorators.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AccessTokenPayload }>();
    const roles = request.user?.roles ?? [];
    if (!requiredRoles.some((role) => roles.includes(role))) {
      throw new ForbiddenException(`Requires one of role(s): ${requiredRoles.join(', ')}.`);
    }
    return true;
  }
}
