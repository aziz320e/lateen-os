import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { AccessTokenPayload } from './token.service.js';

export const ROLES_KEY = 'auth:roles';
export const PERMISSION_KEY = 'auth:permission';

/** Requires the authenticated user to hold at least one of the given role names. */
export const Roles = (...roles: readonly string[]) => SetMetadata(ROLES_KEY, roles);

/** Requires the authenticated user to hold the given permission code — the decision is made by the real gateway Policy Evaluation engine (`AuthorizationService.evaluate()`), never a local comparison. */
export const RequirePermission = (code: string) => SetMetadata(PERMISSION_KEY, code);

/** Extracts the authenticated principal (attached to the request by `JwtAuthGuard`). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AccessTokenPayload => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: AccessTokenPayload }>();
    return request.user as AccessTokenPayload;
  },
);
