import type { FastifyInstance } from 'fastify';
import type { ProductDiscoveryService } from '../../ports/inbound/product-discovery-service.js';
import type { DiscoveryRunId, OrganizationId } from '../../domain/identifiers.js';
import {
  getRunParamsSchema,
  getRunQuerySchema,
  listRecommendationsQuerySchema,
  listRunsQuerySchema,
  runDiscoveryBodySchema,
} from '../../validation/schemas.js';

export function registerDiscoveryRoutes(app: FastifyInstance, service: ProductDiscoveryService) {
  app.post('/api/v1/discovery/run', async (request, reply) => {
    const body = runDiscoveryBodySchema.parse(request.body);
    const run = await service.runDiscovery({
      organizationId: body.organizationId as OrganizationId,
      keywords: body.keywords,
      sources: body.sources,
      runtimeAgentId: body.runtimeAgentId,
    });
    return reply.status(201).send(run);
  });

  app.get('/api/v1/discovery/runs', async (request) => {
    const query = listRunsQuerySchema.parse(request.query);
    return service.listRuns({ organizationId: query.organizationId as OrganizationId });
  });

  app.get('/api/v1/discovery/runs/:id', async (request, reply) => {
    const params = getRunParamsSchema.parse(request.params);
    const query = getRunQuerySchema.parse(request.query);
    const run = await service.getRun({
      organizationId: query.organizationId as OrganizationId,
      runId: params.id as DiscoveryRunId,
    });
    if (!run) return reply.status(404).send({ error: 'Not found' });
    return run;
  });

  app.get('/api/v1/discovery/recommendations', async (request) => {
    const query = listRecommendationsQuerySchema.parse(request.query);
    return service.listRecommendations({
      organizationId: query.organizationId as OrganizationId,
      runId: query.runId as DiscoveryRunId | undefined,
      limit: query.limit,
    });
  });
}
