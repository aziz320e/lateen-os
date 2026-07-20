/** @module registry/application-registry */
import { PLATFORM_MANIFEST } from './manifest.js';
import type { ApplicationDefinition } from './types.js';

export class ApplicationRegistry {
  private readonly applications: Map<string, ApplicationDefinition>;

  constructor(applications: readonly ApplicationDefinition[] = PLATFORM_MANIFEST.applications) {
    this.applications = new Map(applications.map((app) => [app.name, app]));
  }

  list(): readonly ApplicationDefinition[] {
    return [...this.applications.values()];
  }

  get(name: string): ApplicationDefinition | undefined {
    return this.applications.get(name);
  }

  resolveUrl(name: string, host = 'localhost'): string | undefined {
    const app = this.get(name);
    if (!app) return undefined;
    return `http://${host}:${app.port}`;
  }
}

export function createApplicationRegistry(): ApplicationRegistry {
  return new ApplicationRegistry();
}
