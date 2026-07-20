/**
 * Graph node definitions for all Business DNA entities in the semantic graph.
 *
 * @module nodes
 */
export * from './node-type.js';
export * from './types.js';
export * from './organization.js';
export * from './branch.js';
export * from './department.js';
export * from './employee.js';
export * from './customer.js';
export * from './supplier.js';
export * from './machine.js';
export * from './capability.js';
export * from './product.js';
export * from './service.js';
export * from './project.js';
export * from './workflow.js';
export * from './policy.js';
export * from './asset.js';
export * from './quotation.js';
export * from './order.js';
export * from './invoice.js';
export * from './ai-agent.js';
export * from './kpi.js';

import { aiAgentNodeDefinition } from './ai-agent.js';
import { assetNodeDefinition } from './asset.js';
import { branchNodeDefinition } from './branch.js';
import { capabilityNodeDefinition } from './capability.js';
import { customerNodeDefinition } from './customer.js';
import { departmentNodeDefinition } from './department.js';
import { employeeNodeDefinition } from './employee.js';
import { invoiceNodeDefinition } from './invoice.js';
import { kpiNodeDefinition } from './kpi.js';
import { machineNodeDefinition } from './machine.js';
import { orderNodeDefinition } from './order.js';
import { organizationNodeDefinition } from './organization.js';
import type { GraphNodeDefinition } from './types.js';
import type { GraphNodeType } from './node-type.js';
import { policyNodeDefinition } from './policy.js';
import { productNodeDefinition } from './product.js';
import { projectNodeDefinition } from './project.js';
import { quotationNodeDefinition } from './quotation.js';
import { serviceNodeDefinition } from './service.js';
import { supplierNodeDefinition } from './supplier.js';
import { workflowNodeDefinition } from './workflow.js';

/** Canonical registry of all graph node definitions. */
export const GRAPH_NODE_DEFINITIONS: Readonly<Record<GraphNodeType, GraphNodeDefinition<GraphNodeType>>> = {
  organization: organizationNodeDefinition,
  branch: branchNodeDefinition,
  department: departmentNodeDefinition,
  employee: employeeNodeDefinition,
  customer: customerNodeDefinition,
  supplier: supplierNodeDefinition,
  machine: machineNodeDefinition,
  capability: capabilityNodeDefinition,
  product: productNodeDefinition,
  service: serviceNodeDefinition,
  project: projectNodeDefinition,
  workflow: workflowNodeDefinition,
  policy: policyNodeDefinition,
  asset: assetNodeDefinition,
  quotation: quotationNodeDefinition,
  order: orderNodeDefinition,
  invoice: invoiceNodeDefinition,
  ai_agent: aiAgentNodeDefinition,
  kpi: kpiNodeDefinition,
};
