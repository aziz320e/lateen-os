export type RouteStatus = 'active' | 'planned';

export interface GatewayRouteDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly gatewayPrefix: string;
  readonly serviceName: string;
  readonly targetBaseUrl: string;
  readonly targetPathPrefix: string;
  readonly healthPath: string;
  readonly version: string;
  readonly status: RouteStatus;
  readonly authRequired: boolean;
  readonly cacheable: boolean;
}

export interface GatewayRequestContext {
  correlationId: string;
  tenantId?: string;
  userId?: string;
  permissions: readonly string[];
  locale: string;
  authType?: 'jwt' | 'api-key' | 'service-token';
}

export interface ProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string | Buffer;
}

export interface DependencyHealth {
  readonly service: string;
  readonly status: 'healthy' | 'unhealthy' | 'planned' | 'unknown';
  readonly latencyMs?: number;
  readonly message?: string;
}

export interface GatewayStatus {
  readonly service: string;
  readonly version: string;
  readonly uptimeSeconds: number;
  readonly routes: {
    readonly total: number;
    readonly active: number;
    readonly planned: number;
  };
  readonly dependencies: readonly DependencyHealth[];
}

export interface AuditEvent {
  readonly correlationId: string;
  readonly tenantId?: string;
  readonly userId?: string;
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
  readonly timestamp: string;
}

export interface CircuitState {
  failures: number;
  openedAt?: number;
  halfOpenAt?: number;
}

export interface RequestMetrics {
  totalRequests: number;
  proxyErrors: number;
  rateLimited: number;
  cacheHits: number;
  cacheMisses: number;
}
