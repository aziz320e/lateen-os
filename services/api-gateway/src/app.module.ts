import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { GatewayController } from './api/gateway/gateway.controller';
import { OpenApiController } from './api/openapi/openapi.controller';
import {
  APP_CONFIG,
  GATEWAY_ROUTES,
  HEALTH_AGGREGATOR,
  METRICS_SERVICE,
  PROXY_SERVICE,
} from './api/tokens';
import { buildRouteRegistry } from './domain/route-registry';
import { ProxyService } from './application/proxy.service';
import { CircuitBreakerService } from './application/circuit-breaker.service';
import { CacheService } from './infrastructure/cache/cache.service';
import { RateLimitService } from './application/rate-limit.service';
import { MetricsService } from './application/metrics.service';
import { HealthAggregatorService } from './application/health-aggregator.service';
import { AuditPublisher } from './infrastructure/nats/audit-publisher';

export interface AppModuleOptions {
  config: AppConfig;
  proxyService: ProxyService;
  healthAggregator: HealthAggregatorService;
  metricsService: MetricsService;
  routes: ReturnType<typeof buildRouteRegistry>;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions) {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: options.config.LOG_LEVEL,
            transport:
              options.config.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
          },
        }),
      ],
      controllers: [HealthController, GatewayController, OpenApiController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: GATEWAY_ROUTES, useValue: options.routes },
        { provide: PROXY_SERVICE, useValue: options.proxyService },
        { provide: HEALTH_AGGREGATOR, useValue: options.healthAggregator },
        { provide: METRICS_SERVICE, useValue: options.metricsService },
      ],
    };
  }
}

export function createGatewayServices(config: AppConfig) {
  const routes = buildRouteRegistry(config);
  const circuitBreaker = new CircuitBreakerService(config);
  const cache = new CacheService(config);
  const rateLimit = new RateLimitService(config);
  const metrics = new MetricsService();
  const auditPublisher = new AuditPublisher(config);
  const proxyService = new ProxyService(config, routes, circuitBreaker, cache, rateLimit, metrics, auditPublisher);
  const healthAggregator = new HealthAggregatorService(config, routes);
  return { routes, proxyService, healthAggregator, metrics, cache, auditPublisher };
}
