import type { AppConfig } from '../config/index';
import type { AuditEvent, GatewayRequestContext, ProxyResult } from '../domain/types';
import { buildTargetUrl, resolveRoute } from '../domain/route-registry';
import type { GatewayRouteDefinition } from '../domain/types';
import { HOP_BY_HOP_HEADERS, loadPolicies } from '../policies/policies';
import { assertAuthorized, GatewayAuthError, resolveRequestContext } from '../middleware/request-context';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CacheService } from '../infrastructure/cache/cache.service';
import { RateLimitService } from './rate-limit.service';
import { MetricsService } from './metrics.service';
import { AuditPublisher } from '../infrastructure/nats/audit-publisher';

export interface ProxyRequestInput {
  method: string;
  path: string;
  query?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string | Buffer;
}

export class ProxyService {
  private readonly policies: ReturnType<typeof loadPolicies>;
  private readonly startedAt = Date.now();

  constructor(
    private readonly config: AppConfig,
    private readonly routes: readonly GatewayRouteDefinition[],
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly cache: CacheService,
    private readonly rateLimit: RateLimitService,
    private readonly metrics: MetricsService,
    private readonly auditPublisher: AuditPublisher,
  ) {
    this.policies = loadPolicies(this.config);
  }

  getRoutes(): readonly GatewayRouteDefinition[] {
    return this.routes;
  }

  getUptimeSeconds(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  async forward(input: ProxyRequestInput): Promise<ProxyResult> {
    this.metrics.recordRequest();
    const started = Date.now();
    const context = resolveRequestContext(input.headers, this.config);
    const route = resolveRoute(this.routes, input.path);

    if (!route) {
      return this.errorResult(404, { error: 'Route not found', path: input.path }, context);
    }

    if (route.id === 'platform') {
      return this.handlePlatformRoute(input.path, context);
    }

    if (route.status === 'planned') {
      return this.errorResult(
        503,
        { error: 'Service not available', route: route.id, status: 'planned' },
        context,
      );
    }

    try {
      assertAuthorized(context, route.authRequired);
    } catch (error) {
      if (error instanceof GatewayAuthError) {
        return this.errorResult(error.statusCode, { error: error.message }, context);
      }
      throw error;
    }

    const rateKey = `${context.tenantId ?? 'anonymous'}:${route.id}`;
    const rate = this.rateLimit.check(rateKey);
    if (!rate.allowed) {
      this.metrics.recordRateLimited();
      return this.errorResult(429, { error: 'Rate limit exceeded' }, context, {
        'Retry-After': String(Math.ceil((rate.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Remaining': '0',
      });
    }

    if (!this.circuitBreaker.canRequest(route.serviceName)) {
      return this.errorResult(503, { error: 'Circuit breaker open', service: route.serviceName }, context);
    }

    const targetUrl = buildTargetUrl(route, input.path);
    const url = input.query ? `${targetUrl}?${input.query}` : targetUrl;
    const cacheKey = this.buildCacheKey(route, input.method, url, context);

    if (route.cacheable && input.method === 'GET') {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.metrics.recordCacheHit();
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Correlation-Id': context.correlationId,
          },
          body: cached,
        };
      }
      this.metrics.recordCacheMiss();
    }

    const outboundHeaders = this.buildOutboundHeaders(input.headers, context);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.policies.retryAttempts; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.policies.retryDelayMs * attempt));
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.policies.requestTimeoutMs);
        const response = await fetch(url, {
          method: input.method,
          headers: outboundHeaders,
          body: input.method === 'GET' || input.method === 'HEAD' ? undefined : input.body,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const responseHeaders: Record<string, string> = {
          'X-Correlation-Id': context.correlationId,
          'X-Gateway-Route': route.id,
          'X-RateLimit-Remaining': String(rate.remaining),
        };
        for (const [key, value] of response.headers.entries()) {
          if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
            responseHeaders[key] = value;
          }
        }

        const body = Buffer.from(await response.arrayBuffer());
        this.circuitBreaker.recordSuccess(route.serviceName);

        if (route.cacheable && input.method === 'GET' && response.ok) {
          await this.cache.set(cacheKey, body.toString('utf8'), this.policies.cacheTtlSeconds);
          responseHeaders['X-Cache'] = 'MISS';
        }

        await this.publishAudit(context, input.method, input.path, response.status, Date.now() - started);
        return { statusCode: response.status, headers: responseHeaders, body };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Proxy failed');
      }
    }

    this.circuitBreaker.recordFailure(route.serviceName);
    this.metrics.recordProxyError();
    await this.publishAudit(context, input.method, input.path, 502, Date.now() - started);
    return this.errorResult(
      502,
      {
        error: 'Upstream service unavailable',
        service: route.serviceName,
        message: lastError?.message,
      },
      context,
    );
  }

  private handlePlatformRoute(path: string, context: GatewayRequestContext): ProxyResult {
    if (path === '/api/platform' || path === '/api/platform/') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'X-Correlation-Id': context.correlationId },
        body: JSON.stringify({
          name: 'Lateen OS API Gateway',
          version: '1.0.0',
          architecture: 'v1.0',
          routes: this.routes.map((route) => ({
            id: route.id,
            prefix: route.gatewayPrefix,
            service: route.serviceName,
            status: route.status,
            version: route.version,
          })),
        }),
      };
    }
    return this.errorResult(404, { error: 'Platform endpoint not found' }, context);
  }

  private buildOutboundHeaders(
    incoming: Record<string, string | string[] | undefined>,
    context: GatewayRequestContext,
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
      if (typeof value === 'string') headers[key] = value;
      else if (Array.isArray(value) && value[0]) headers[key] = value[0];
    }
    headers['X-Correlation-Id'] = context.correlationId;
    if (context.tenantId) headers['X-Tenant-Id'] = context.tenantId;
    if (context.locale) headers['Accept-Language'] = context.locale;
    return headers;
  }

  private buildCacheKey(
    route: GatewayRouteDefinition,
    method: string,
    url: string,
    context: GatewayRequestContext,
  ): string {
    return `gateway:${route.id}:${method}:${context.tenantId ?? 'global'}:${url}`;
  }

  private errorResult(
    statusCode: number,
    payload: Record<string, unknown>,
    context: GatewayRequestContext,
    extraHeaders: Record<string, string> = {},
  ): ProxyResult {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': context.correlationId,
        ...extraHeaders,
      },
      body: JSON.stringify(payload),
    };
  }

  private async publishAudit(
    context: GatewayRequestContext,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
  ): Promise<void> {
    const event: AuditEvent = {
      correlationId: context.correlationId,
      tenantId: context.tenantId,
      userId: context.userId,
      method,
      path,
      statusCode,
      durationMs,
      timestamp: new Date().toISOString(),
    };
    await this.auditPublisher.publish(event);
  }
}
