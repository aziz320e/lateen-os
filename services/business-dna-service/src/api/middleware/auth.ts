import type { FastifyReply, FastifyRequest } from 'fastify';
import type { AuthContext, AuthProvider, AuthorizationProvider } from '../../domain/ports.js';
import type { OrganizationId } from '@lateen-os/business-dna';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
    organizationId?: OrganizationId;
  }
}

export function createAuthMiddleware(authProvider: AuthProvider) {
  return async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
    if (request.url.startsWith('/health') || request.url.startsWith('/metrics') || request.url.startsWith('/docs')) {
      return;
    }

    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const auth = await authProvider.authenticate(token);

    if (!auth) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    request.auth = auth;
    const orgHeader = request.headers['x-organization-id'];
    request.organizationId = (auth.organizationId ?? orgHeader) as OrganizationId | undefined;
  };
}

export function createAuthorizeMiddleware(
  authorizationProvider: AuthorizationProvider,
  resource: string,
) {
  return async function authorizeMiddleware(request: FastifyRequest, reply: FastifyReply) {
    const organizationId = request.organizationId ?? (request.params as { organizationId?: string }).organizationId;
    if (!organizationId || !request.auth) return;

    const action = request.method === 'GET' ? 'read' : request.method === 'DELETE' ? 'delete' : 'update';
    const allowed = await authorizationProvider.authorize({
      organizationId: organizationId as OrganizationId,
      resource,
      action: request.method === 'POST' ? 'create' : action,
      subject: request.auth.subject,
    });

    if (!allowed) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
}
