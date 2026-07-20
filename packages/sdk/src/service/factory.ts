/** @module service/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import {
  serviceApiRouteSchema,
  serviceDefinitionInputSchema,
  serviceEventSchema,
  serviceHealthSchema,
  type ServiceApiRoute,
  type ServiceDefinition,
  type ServiceDefinitionInput,
  type ServiceEvent,
  type ServiceHealth,
} from './types.js';

export interface ServiceFactory {
  define(input: ServiceDefinitionInput): ServiceDefinition;
  create(input: ServiceDefinitionInput): ServiceDefinition;
  registerApi(definition: ServiceDefinition, routes: ServiceApiRoute[]): ServiceDefinition;
  registerHealth(definition: ServiceDefinition, health: ServiceHealth): ServiceDefinition;
  registerEvents(definition: ServiceDefinition, events: ServiceEvent[]): ServiceDefinition;
}

export function createServiceFactory(_context: SDKContext): ServiceFactory {
  const define = (input: ServiceDefinitionInput): ServiceDefinition => {
    const parsed = serviceDefinitionInputSchema.parse(input);
    return {
      ...parsed,
      apiRoutes: [],
      health: { path: '/health' },
      events: [],
      sdkVersion: formatSdkVersion(),
    };
  };

  return {
    define,
    create: define,
    registerApi(definition, routes) {
      return {
        ...definition,
        apiRoutes: routes.map((route) => serviceApiRouteSchema.parse(route)),
      };
    },
    registerHealth(definition, health) {
      return { ...definition, health: serviceHealthSchema.parse(health) };
    },
    registerEvents(definition, events) {
      return {
        ...definition,
        events: events.map((event) => serviceEventSchema.parse(event)),
      };
    },
  };
}

export const defineService = (input: ServiceDefinitionInput): ServiceDefinition =>
  createServiceFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);

export const createService = defineService;
