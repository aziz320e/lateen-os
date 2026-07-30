import { beforeAll, describe, expect, it } from 'vitest';
import { EnginesController } from '../src/api/engines/engines.controller.js';
import { HealthController } from '../src/api/health/health.controller.js';
import { PlatformController } from '../src/api/platform/platform.controller.js';
import { VersionController } from '../src/api/version/version.controller.js';
import { loadConfig } from '../src/config/index.js';
import { AnalyticsIntegrationService } from '../src/analytics/analytics-integration.service.js';
import { GatewayIntegrationService } from '../src/gateway/gateway-integration.service.js';
import { ObservabilityIntegrationService } from '../src/observability/observability-integration.service.js';
import { RuntimeRegistryService } from '../src/runtime-registry/runtime-registry.service.js';
import { AuthenticationService } from '../src/security/authentication.service.js';
import { AuthorizationService } from '../src/security/authorization.service.js';

/**
 * These endpoint tests wire the real services directly (no HTTP
 * listener, no NestJS TestingModule ceremony) — every controller method
 * below runs against the same real engine runtimes the platform host
 * actually serves, just invoked in-process.
 */
describe('Platform endpoints', () => {
  let registry: RuntimeRegistryService;
  let observability: ObservabilityIntegrationService;
  let gateway: GatewayIntegrationService;
  let authentication: AuthenticationService;
  let authorization: AuthorizationService;
  let analytics: AnalyticsIntegrationService;

  beforeAll(async () => {
    registry = new RuntimeRegistryService();
    registry.onModuleInit();
    observability = new ObservabilityIntegrationService(registry);
    await observability.onModuleInit();
    gateway = new GatewayIntegrationService(registry);
    await gateway.onModuleInit();
    authentication = new AuthenticationService(registry);
    authorization = new AuthorizationService(registry);
    analytics = new AnalyticsIntegrationService(registry);
    await analytics.onModuleInit();
  });

  it('GET /health reports every hosted engine as healthy', async () => {
    const controller = new HealthController(registry, observability);
    const result = await controller.health();
    expect(result.status).toBe('healthy');
    expect(result.runningEngines).toBe(result.hostedEngines);
    expect(result.componentHealthChecks).toBeGreaterThan(0);
  });

  it('GET /platform reports real integration availability', async () => {
    const config = loadConfig({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    const controller = new PlatformController(
      config,
      registry,
      gateway,
      authentication,
      authorization,
    );
    const result = await controller.platform();
    expect(result.platform).toBe('Lateen OS');
    expect(result.hostedEngines).toBeGreaterThan(0);
    expect(result.integrations.apiGateway).toBe(true);
    expect(result.integrations.authentication).toBe(true);
    expect(result.integrations.authorization).toBe(true);
  });

  it('GET /engines lists all 39 catalog entries with real per-engine status', () => {
    const controller = new EnginesController(registry);
    const result = controller.engines();
    expect(result.total).toBe(39);
    expect(result.hosted).toBe(result.running);
    expect(result.engines).toHaveLength(39);
  });

  it("GET /version reports this package's real name and version", () => {
    const controller = new VersionController();
    const result = controller.version();
    expect(result.service).toBe('@lateen-os/backend');
    expect(result.version).toBe('0.0.0');
    expect(result.nodeVersion).toBe(process.version);
  });
});
