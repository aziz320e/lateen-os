import type { FastifyInstance } from 'fastify';
import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';
import type { EntityCrudService } from '../../application/crud-service.js';
import type { OrganizationId } from '@lateen-os/business-dna';
import { idParamSchema, orgIdParamSchema, orgParamSchema } from '../../validation/schemas.js';
import type { AuthorizationProvider } from '../../domain/ports.js';
import { createAuthorizeMiddleware } from '../middleware/auth.js';

export interface EntityRouteConfig {
  readonly resource: string;
  readonly path: string;
  readonly bodySchema: ZodTypeAny | ZodObject<ZodRawShape>;
  readonly service: EntityCrudService<{ id: string; organizationId?: OrganizationId }>;
  readonly tenantScoped: boolean;
  readonly authorizationProvider: AuthorizationProvider;
  readonly listByOrganization?: (organizationId: OrganizationId) => Promise<readonly unknown[]>;
}

export function registerEntityRoutes(app: FastifyInstance, config: EntityRouteConfig) {
  const authorize = createAuthorizeMiddleware(config.authorizationProvider, config.resource);

  if (config.tenantScoped) {
    const collection = `/api/v1/organizations/:organizationId/${config.path}`;
    const item = `${collection}/:id`;

    app.get(collection, { preHandler: authorize }, async (request) => {
      const params = orgParamSchema.parse(request.params);
      if (config.listByOrganization) {
        return config.listByOrganization(params.organizationId as OrganizationId);
      }
      return [];
    });

    app.get(item, { preHandler: authorize }, async (request, reply) => {
      const params = orgIdParamSchema.parse(request.params);
      const entity = await config.service.get(params.organizationId as OrganizationId, params.id);
      if (!entity) return reply.status(404).send({ error: 'Not found' });
      return entity;
    });

    app.post(collection, { preHandler: authorize }, async (request, reply) => {
      const params = orgParamSchema.parse(request.params);
      const body = config.bodySchema.parse(request.body);
      const entity = await config.service.create(params.organizationId as OrganizationId, body as Record<string, unknown>);
      return reply.status(201).send(entity);
    });

    app.put(item, { preHandler: authorize }, async (request, reply) => {
      const params = orgIdParamSchema.parse(request.params);
      const body = 'partial' in config.bodySchema
        ? config.bodySchema.partial().parse(request.body)
        : config.bodySchema.parse(request.body);
      const entity = await config.service.update(
        params.organizationId as OrganizationId,
        params.id,
        body as Record<string, unknown>,
      );
      if (!entity) return reply.status(404).send({ error: 'Not found' });
      return entity;
    });

    app.delete(item, { preHandler: authorize }, async (request, reply) => {
      const params = orgIdParamSchema.parse(request.params);
      const removed = await config.service.remove(params.organizationId as OrganizationId, params.id);
      if (!removed) return reply.status(404).send({ error: 'Not found' });
      return reply.status(204).send();
    });
    return;
  }

  const collection = `/api/v1/${config.path}`;
  const item = `${collection}/:id`;

  app.get(item, { preHandler: authorize }, async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const entity = await config.service.get(params.id as OrganizationId, params.id);
    if (!entity) return reply.status(404).send({ error: 'Not found' });
    return entity;
  });

  app.post(collection, { preHandler: authorize }, async (request, reply) => {
    const body = config.bodySchema.parse(request.body);
    const id = (body as { id?: string }).id ?? crypto.randomUUID();
    const entity = await config.service.create(id as OrganizationId, { ...body, id } as Record<string, unknown>);
    return reply.status(201).send(entity);
  });

  app.put(item, { preHandler: authorize }, async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const body = 'partial' in config.bodySchema
      ? config.bodySchema.partial().parse(request.body)
      : config.bodySchema.parse(request.body);
    const entity = await config.service.update(params.id as OrganizationId, params.id, body as Record<string, unknown>);
    if (!entity) return reply.status(404).send({ error: 'Not found' });
    return entity;
  });

  app.delete(item, { preHandler: authorize }, async (request, reply) => {
    const params = idParamSchema.parse(request.params);
    const removed = await config.service.remove(params.id as OrganizationId, params.id);
    if (!removed) return reply.status(404).send({ error: 'Not found' });
    return reply.status(204).send();
  });
}
