import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid() });
export const orgParamSchema = z.object({ organizationId: z.string().uuid() });
export const orgIdParamSchema = orgParamSchema.merge(idParamSchema);

export const auditFieldsSchema = z.object({
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const organizationBodySchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().min(1),
  name: z.string().min(1),
  legalName: z.string().min(1),
  registrationNumber: z.string().min(1),
  taxId: z.string().min(1),
  status: z.enum(['draft', 'active', 'suspended', 'archived']),
  defaultCurrency: z.string().length(3),
  defaultLocale: z.string().min(2),
  timezone: z.string().min(1),
  foundedAt: z.string().optional(),
  operatingModel: z.literal('ai_first'),
  proactiveAiEnabled: z.boolean().default(true),
  productionModel: z.enum(['make_to_order', 'make_to_stock', 'hybrid']),
  serviceCoverage: z.enum(['local', 'regional', 'nationwide']),
  industryVerticals: z.array(z.string()).default([]),
}).passthrough();

export const tenantEntityBodySchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
}).passthrough();

export const branchBodySchema = tenantEntityBodySchema.extend({
  type: z.enum(['headquarters', 'branch', 'subsidiary', 'warehouse', 'remote']),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
});

export const departmentBodySchema = tenantEntityBodySchema.extend({
  status: z.enum(['active', 'inactive', 'archived']),
});

export const employeeBodySchema = tenantEntityBodySchema.extend({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  employmentType: z.enum(['full_time', 'part_time', 'contractor', 'intern']),
  status: z.enum(['draft', 'active', 'on_leave', 'suspended', 'terminated', 'archived']),
});

export const roleBodySchema = tenantEntityBodySchema.extend({
  type: z.enum(['system', 'custom', 'ai_workforce']),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
});

export const permissionBodySchema = tenantEntityBodySchema.extend({
  resource: z.string().min(1),
  action: z.enum(['create', 'read', 'update', 'delete', 'execute', 'approve']),
  scope: z.enum(['own', 'department', 'branch', 'organization', 'global']),
  status: z.enum(['draft', 'active', 'inactive', 'archived']),
});

export const customerBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
  segment: z.string().min(1),
  currency: z.string().length(3),
});

export const supplierBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
});

export const productBodySchema = tenantEntityBodySchema.extend({
  status: z.string().min(1),
  category: z.string().min(1),
  currency: z.string().length(3),
  unitOfMeasure: z.string().min(1),
  productionType: z.string().min(1),
});

export const serviceBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
  pricingModel: z.string().min(1),
  currency: z.string().length(3),
});

export const machineBodySchema = tenantEntityBodySchema.extend({
  branchId: z.string().uuid(),
  status: z.string().min(1),
  ownerDepartmentId: z.string().uuid(),
  category: z.string().min(1),
  type: z.string().min(1),
});

export const projectBodySchema = tenantEntityBodySchema.extend({
  status: z.string().min(1),
  projectType: z.string().min(1),
  deliveryModel: z.string().min(1),
  ownerId: z.string().uuid(),
});

export const commercialBodySchema = z.object({
  id: z.string().uuid().optional(),
  organizationId: z.string().uuid(),
  number: z.string().min(1),
  customerId: z.string().uuid(),
  status: z.string().min(1),
  currency: z.string().length(3),
  subtotal: z.string(),
  total: z.string(),
  lineItems: z.array(z.record(z.unknown())).default([]),
}).passthrough();

export const invoiceBodySchema = commercialBodySchema.extend({
  type: z.string().min(1),
  amountDue: z.string(),
});

export const workflowBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
  version: z.number().int().positive().default(1),
  stages: z.array(z.record(z.unknown())).default([]),
});

export const policyBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
});

export const kpiBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
  unit: z.string().min(1),
  direction: z.string().min(1),
  frequency: z.string().min(1),
});

export const assetBodySchema = tenantEntityBodySchema.extend({
  type: z.string().min(1),
  status: z.string().min(1),
});

export const agentBodySchema = tenantEntityBodySchema.extend({
  workforceType: z.string().min(1),
  status: z.string().min(1),
  proactiveEnabled: z.boolean().default(true),
  reactiveEnabled: z.boolean().default(true),
});

export type OrganizationBody = z.infer<typeof organizationBodySchema>;
