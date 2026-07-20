/** @module application/factory */
import type { SDKContext } from '../core/types.js';
import { formatSdkVersion } from '../core/version.js';
import {
  applicationDefinitionInputSchema,
  applicationPageSchema,
  applicationRouteSchema,
  applicationWidgetSchema,
  type ApplicationDefinition,
  type ApplicationDefinitionInput,
  type ApplicationPage,
  type ApplicationRoute,
  type ApplicationWidget,
} from './types.js';

export interface ApplicationFactory {
  define(input: ApplicationDefinitionInput): ApplicationDefinition;
  create(input: ApplicationDefinitionInput): ApplicationDefinition;
  registerRoutes(definition: ApplicationDefinition, routes: ApplicationRoute[]): ApplicationDefinition;
  registerPages(definition: ApplicationDefinition, pages: ApplicationPage[]): ApplicationDefinition;
  registerWidgets(definition: ApplicationDefinition, widgets: ApplicationWidget[]): ApplicationDefinition;
}

export function createApplicationFactory(_context: SDKContext): ApplicationFactory {
  const define = (input: ApplicationDefinitionInput): ApplicationDefinition => {
    const parsed = applicationDefinitionInputSchema.parse(input);
    return {
      ...parsed,
      routes: [],
      pages: [],
      widgets: [],
      sdkVersion: formatSdkVersion(),
    };
  };

  return {
    define,
    create: define,
    registerRoutes(definition, routes) {
      return {
        ...definition,
        routes: routes.map((route) => applicationRouteSchema.parse(route)),
      };
    },
    registerPages(definition, pages) {
      return {
        ...definition,
        pages: pages.map((page) => applicationPageSchema.parse(page)),
      };
    },
    registerWidgets(definition, widgets) {
      return {
        ...definition,
        widgets: widgets.map((widget) => applicationWidgetSchema.parse(widget)),
      };
    },
  };
}

export const defineApplication = (input: ApplicationDefinitionInput): ApplicationDefinition =>
  createApplicationFactory({
    config: { workspaceRoot: process.cwd(), environment: 'development' },
    version: { major: 1, minor: 0, patch: 0, architecture: '1.0' },
    createdAt: new Date().toISOString(),
  }).define(input);

export const createApplication = defineApplication;
