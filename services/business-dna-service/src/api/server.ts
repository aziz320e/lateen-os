import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { AppConfig } from '../config/index.js';
import type { ApplicationServices } from '../application/crud-service.js';
import type { AuthProvider, AuthorizationProvider } from '../domain/ports.js';
import type { Repositories } from '../repositories/prisma-repositories.js';
import type { OrganizationId } from '@lateen-os/business-dna';
import { createAuthMiddleware } from './middleware/auth.js';
import { registerEntityRoutes } from './routes/entity-routes.js';
import {
  agentBodySchema,
  assetBodySchema,
  branchBodySchema,
  commercialBodySchema,
  customerBodySchema,
  departmentBodySchema,
  employeeBodySchema,
  invoiceBodySchema,
  kpiBodySchema,
  machineBodySchema,
  organizationBodySchema,
  permissionBodySchema,
  policyBodySchema,
  productBodySchema,
  projectBodySchema,
  roleBodySchema,
  serviceBodySchema,
  supplierBodySchema,
  workflowBodySchema,
} from '../validation/schemas.js';

export interface CreateServerDeps {
  config: AppConfig;
  services: ApplicationServices;
  repositories: Repositories;
  authProvider: AuthProvider;
  authorizationProvider: AuthorizationProvider;
}

type ListableRepo = {
  findByOrganization(organizationId: OrganizationId): Promise<readonly unknown[]>;
};

function repoList(repositories: Repositories, key: keyof Repositories) {
  const repo = repositories[key] as ListableRepo;
  return (organizationId: OrganizationId) => repo.findByOrganization(organizationId);
}

export async function createServer(deps: CreateServerDeps) {
  const app = Fastify({
    logger: {
      level: deps.config.LOG_LEVEL,
      base: { service: 'business-dna-service' },
    },
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Lateen OS — Business DNA API',
        description: 'System of Record for Business DNA (Layer 1)',
        version: '1.0.0',
      },
      servers: [{ url: `http://${deps.config.HOST}:${deps.config.PORT}` }],
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  app.addHook('onRequest', createAuthMiddleware(deps.authProvider));

  app.get('/health', async () => ({ status: 'ok', service: 'business-dna-service' }));
  app.get('/metrics', async () => ({ status: 'ok', note: 'Use OTel collector for metrics' }));

  const entities = [
    { path: 'organizations', resource: 'organization', schema: organizationBodySchema, service: deps.services.organization, tenantScoped: false },
    { path: 'branches', resource: 'branch', schema: branchBodySchema, service: deps.services.branch, tenantScoped: true },
    { path: 'departments', resource: 'department', schema: departmentBodySchema, service: deps.services.department, tenantScoped: true },
    { path: 'employees', resource: 'employee', schema: employeeBodySchema, service: deps.services.employee, tenantScoped: true },
    { path: 'roles', resource: 'role', schema: roleBodySchema, service: deps.services.role, tenantScoped: true },
    { path: 'permissions', resource: 'permission', schema: permissionBodySchema, service: deps.services.permission, tenantScoped: true },
    { path: 'customers', resource: 'customer', schema: customerBodySchema, service: deps.services.customer, tenantScoped: true },
    { path: 'suppliers', resource: 'supplier', schema: supplierBodySchema, service: deps.services.supplier, tenantScoped: true },
    { path: 'products', resource: 'product', schema: productBodySchema, service: deps.services.product, tenantScoped: true },
    { path: 'services', resource: 'service', schema: serviceBodySchema, service: deps.services.service, tenantScoped: true },
    { path: 'machines', resource: 'machine', schema: machineBodySchema, service: deps.services.machine, tenantScoped: true },
    { path: 'projects', resource: 'project', schema: projectBodySchema, service: deps.services.project, tenantScoped: true },
    { path: 'quotations', resource: 'quotation', schema: commercialBodySchema, service: deps.services.quotation, tenantScoped: true },
    { path: 'orders', resource: 'order', schema: commercialBodySchema, service: deps.services.order, tenantScoped: true },
    { path: 'invoices', resource: 'invoice', schema: invoiceBodySchema, service: deps.services.invoice, tenantScoped: true },
    { path: 'workflows', resource: 'workflow', schema: workflowBodySchema, service: deps.services.workflow, tenantScoped: true },
    { path: 'policies', resource: 'policy', schema: policyBodySchema, service: deps.services.policy, tenantScoped: true },
    { path: 'kpis', resource: 'kpi', schema: kpiBodySchema, service: deps.services.kpi, tenantScoped: true },
    { path: 'assets', resource: 'asset', schema: assetBodySchema, service: deps.services.asset, tenantScoped: true },
    { path: 'agents', resource: 'agent', schema: agentBodySchema, service: deps.services.agent, tenantScoped: true },
  ] as const;

  const listablePaths: Partial<Record<string, keyof Repositories>> = {
    branches: 'branch',
    departments: 'department',
    customers: 'customer',
    products: 'product',
    machines: 'machine',
    projects: 'project',
    quotations: 'quotation',
    orders: 'order',
    invoices: 'invoice',
    agents: 'agent',
  };

  for (const entity of entities) {
    const repoKey = listablePaths[entity.path];
    registerEntityRoutes(app, {
      path: entity.path,
      resource: entity.resource,
      bodySchema: entity.schema,
      service: entity.service,
      tenantScoped: entity.tenantScoped,
      authorizationProvider: deps.authorizationProvider,
      listByOrganization: repoKey ? repoList(deps.repositories, repoKey) : undefined,
    });
  }

  return app;
}
