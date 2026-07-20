import type { FastifyRequest } from 'fastify';

export function resolveOrganizationId(req: FastifyRequest, fallback: string): string {
  const header = req.headers['x-organization-id'];
  if (typeof header === 'string' && header.length > 0) return header;
  return fallback;
}
