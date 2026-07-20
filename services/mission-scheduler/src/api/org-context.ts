import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export const ORG_HEADER = 'x-organization-id';

export function resolveOrganizationId(request: FastifyRequest, fallback?: string): string {
  const header = request.headers[ORG_HEADER];
  const value = Array.isArray(header) ? header[0] : header;
  const orgId = value ?? fallback;
  if (!orgId) throw new BadRequestException(`Missing ${ORG_HEADER} header`);
  return orgId;
}

export const OrganizationId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();
  return resolveOrganizationId(request);
});
