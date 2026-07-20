import { All, Controller, Get, Inject, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PROXY_SERVICE, METRICS_SERVICE } from '../tokens';
import type { ProxyService } from '../../application/proxy.service';
import type { MetricsService } from '../../application/metrics.service';
import { SECURITY_HEADERS } from '../../policies/policies';

@Controller()
export class GatewayController {
  constructor(
    @Inject(PROXY_SERVICE) private readonly proxyService: ProxyService,
    @Inject(METRICS_SERVICE) private readonly metricsService: MetricsService,
  ) {}

  @Get('gateway/routes')
  listRoutes() {
    return {
      routes: this.proxyService.getRoutes().map((route) => ({
        id: route.id,
        displayName: route.displayName,
        gatewayPrefix: route.gatewayPrefix,
        serviceName: route.serviceName,
        version: route.version,
        status: route.status,
        authRequired: route.authRequired,
        cacheable: route.cacheable,
      })),
    };
  }

  @Get('gateway/status')
  async status() {
    const routes = this.proxyService.getRoutes();
    return {
      service: 'api-gateway',
      version: '1.0.0',
      uptimeSeconds: this.proxyService.getUptimeSeconds(),
      routes: {
        total: routes.length,
        active: routes.filter((route) => route.status === 'active').length,
        planned: routes.filter((route) => route.status === 'planned').length,
      },
      metrics: this.metricsService.snapshot(),
    };
  }

  @Get('metrics')
  metrics() {
    return this.metricsService.toPrometheus();
  }

  @All('api/*')
  async proxy(@Req() request: FastifyRequest, @Res() reply: FastifyReply) {
    const url = request.url.split('?');
    const path = url[0] ?? request.url;
    const query = url[1];
    const body =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : typeof request.body === 'string'
          ? request.body
          : request.body
            ? JSON.stringify(request.body)
            : undefined;

    const result = await this.proxyService.forward({
      method: request.method,
      path,
      query,
      headers: request.headers as Record<string, string | string[] | undefined>,
      body,
    });

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      reply.header(key, value);
    }
    for (const [key, value] of Object.entries(result.headers)) {
      reply.header(key, value);
    }
    return reply.status(result.statusCode).send(result.body);
  }
}
