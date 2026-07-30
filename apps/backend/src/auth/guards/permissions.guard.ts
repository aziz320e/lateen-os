/**
 * Permission validation — requires the authenticated user (attached by
 * `JwtAuthGuard`, which must run first) to hold the permission code
 * declared via `@RequirePermission(...)`. The allow/deny decision itself
 * is always made by the real gateway Policy Evaluation engine
 * (`AuthorizationService.evaluate()`) against a policy registered per
 * permission code at RBAC-seed time — this guard never reimplements
 * permission matching.
 */
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { AuthorizationService } from '../../security/authorization.service.js';
import { PERMISSION_KEY } from '../decorators.js';
import type { AccessTokenPayload } from '../token.service.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authorization: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermission) return true;

    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AccessTokenPayload }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('No authenticated principal.');

    const decision = await this.authorization.evaluate(user.organizationId, {
      resource: requiredPermission,
      action: 'grant',
      principalScopes: user.permissions,
    });

    if (!decision || decision.effect !== 'allow') {
      throw new ForbiddenException(`Requires permission: ${requiredPermission}.`);
    }
    return true;
  }
}
