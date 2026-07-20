/** @module registry/service-registry */
import { PLATFORM_MANIFEST } from './manifest.js';
import type { PlatformServiceDefinition } from './types.js';

export class ServiceRegistry {
  private readonly services: Map<string, PlatformServiceDefinition>;

  constructor(services: readonly PlatformServiceDefinition[] = PLATFORM_MANIFEST.services) {
    this.services = new Map(services.map((service) => [service.name, service]));
  }

  list(): readonly PlatformServiceDefinition[] {
    return [...this.services.values()];
  }

  get(name: string): PlatformServiceDefinition | undefined {
    return this.services.get(name);
  }

  getBackendServices(): readonly PlatformServiceDefinition[] {
    return this.list().filter((service) => service.kind === 'backend');
  }

  resolveUrl(name: string, host = 'localhost'): string | undefined {
    const service = this.get(name);
    if (!service) return undefined;
    return `http://${host}:${service.port}`;
  }
}

export function createServiceRegistry(): ServiceRegistry {
  return new ServiceRegistry();
}
