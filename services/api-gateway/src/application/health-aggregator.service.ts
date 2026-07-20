import type { AppConfig } from '../config/index';
import type { DependencyHealth, GatewayRouteDefinition } from '../domain/types';
import { listUniqueServices } from '../domain/route-registry';

export class HealthAggregatorService {
  constructor(
    private readonly config: AppConfig,
    private readonly routes: readonly GatewayRouteDefinition[],
  ) {}

  async checkDependencies(): Promise<readonly DependencyHealth[]> {
    const services = listUniqueServices(this.routes);
    const checks = await Promise.all(
      services.map(async (route) => {
        const started = Date.now();
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5_000);
          const response = await fetch(`${route.targetBaseUrl}${route.healthPath}`, {
            signal: controller.signal,
          });
          clearTimeout(timeout);
          return {
            service: route.serviceName,
            status: response.ok ? ('healthy' as const) : ('unhealthy' as const),
            latencyMs: Date.now() - started,
            message: response.ok ? undefined : `HTTP ${response.status}`,
          };
        } catch (error) {
          return {
            service: route.serviceName,
            status: 'unhealthy' as const,
            latencyMs: Date.now() - started,
            message: error instanceof Error ? error.message : 'Health check failed',
          };
        }
      }),
    );

    const planned = this.routes
      .filter((route) => route.status === 'planned')
      .map((route) => ({
        service: route.serviceName,
        status: 'planned' as const,
        message: 'Service not yet deployed',
      }));

    return [...checks, ...planned];
  }

  isReady(dependencies: readonly DependencyHealth[]): boolean {
    const required = listUniqueServices(this.routes).map((r) => r.serviceName);
    const unhealthyRequired = dependencies.filter(
      (dep) => required.includes(dep.service) && dep.status === 'unhealthy',
    );
    return unhealthyRequired.length === 0;
  }
}
