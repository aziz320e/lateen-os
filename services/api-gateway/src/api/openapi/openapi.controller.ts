import { Controller, Get } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { GATEWAY_ROUTES } from '../tokens';
import type { GatewayRouteDefinition } from '../../domain/types';

@Controller()
export class OpenApiController {
  constructor(@Inject(GATEWAY_ROUTES) private readonly routes: readonly GatewayRouteDefinition[]) {}

  @Get('openapi.json')
  spec() {
    const paths: Record<string, unknown> = {
      '/health': {
        get: { summary: 'Gateway health', tags: ['Health'] },
      },
      '/gateway/routes': {
        get: { summary: 'List gateway routes', tags: ['Gateway'] },
      },
      '/gateway/status': {
        get: { summary: 'Gateway status', tags: ['Gateway'] },
      },
      '/metrics': {
        get: { summary: 'Prometheus metrics', tags: ['Observability'] },
      },
    };

    for (const route of this.routes) {
      paths[`${route.gatewayPrefix}/{path*}`] = {
        get: { summary: `Proxy GET to ${route.displayName}`, tags: [route.displayName] },
        post: { summary: `Proxy POST to ${route.displayName}`, tags: [route.displayName] },
        put: { summary: `Proxy PUT to ${route.displayName}`, tags: [route.displayName] },
        patch: { summary: `Proxy PATCH to ${route.displayName}`, tags: [route.displayName] },
        delete: { summary: `Proxy DELETE to ${route.displayName}`, tags: [route.displayName] },
      };
    }

    return {
      openapi: '3.1.0',
      info: {
        title: 'Lateen OS Enterprise API Gateway',
        version: '1.0.0',
        description: 'Unified entry point for Lateen OS platform services',
      },
      servers: [{ url: 'http://localhost:4008' }],
      paths,
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-Api-Key' },
          serviceTokenAuth: { type: 'apiKey', in: 'header', name: 'X-Service-Token' },
        },
      },
    };
  }
}
