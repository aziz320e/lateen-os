/**
 * @lateen-os/business-dna — Business DNA Engine
 *
 * Canonical domain model for Lateen OS (Architecture v1.0 Locked).
 * Layer 1 of the architecture — single source of truth for the business model.
 *
 * This package provides:
 * - Aggregate type definitions and enums
 * - Value object interfaces
 * - Domain event types (`{entity}.{action}` convention)
 * - Repository port interfaces (no implementations)
 *
 * No UI, API, database, ORM, or business logic.
 * Framework-agnostic. TypeScript only.
 *
 * @packageDocumentation
 */

export * from './shared/index.js';

export * as organization from './organization/index.js';
export * as branch from './branch/index.js';
export * as department from './department/index.js';
export * as employee from './employee/index.js';
export * as customer from './customer/index.js';
export * as supplier from './supplier/index.js';
export * as product from './product/index.js';
export * as service from './service/index.js';
export * as machine from './machine/index.js';
export * as project from './project/index.js';
export * as quotation from './quotation/index.js';
export * as order from './order/index.js';
export * as invoice from './invoice/index.js';
export * as workflow from './workflow/index.js';
export * as policy from './policy/index.js';
export * as kpi from './kpi/index.js';
export * as asset from './asset/index.js';
export * as agent from './agent/index.js';
export * as role from './role/index.js';
export * as permission from './permission/index.js';

/** Re-export aggregate interfaces at package root for convenience. */
export type { Organization } from './organization/types.js';
export type { Branch } from './branch/types.js';
export type { Department } from './department/types.js';
export type { Employee } from './employee/types.js';
export type { Customer } from './customer/types.js';
export type { Supplier } from './supplier/types.js';
export type { Product } from './product/types.js';
export type { Service } from './service/types.js';
export type { Machine } from './machine/types.js';
export type { Project } from './project/types.js';
export type { Quotation } from './quotation/types.js';
export type { Order } from './order/types.js';
export type { Invoice } from './invoice/types.js';
export type { Workflow } from './workflow/types.js';
export type { Policy } from './policy/types.js';
export type { Kpi } from './kpi/types.js';
export type { Asset } from './asset/types.js';
export type { Agent } from './agent/types.js';
export type { Role } from './role/types.js';
export type { Permission } from './permission/types.js';
/** Schema-aligned alias — AI Agent in Business DNA schema. */
export type { AiAgent } from './agent/index.js';

/** Re-export repository ports at package root for convenience. */
export type { OrganizationRepository } from './organization/repository.js';
export type { BranchRepository } from './branch/repository.js';
export type { DepartmentRepository } from './department/repository.js';
export type { EmployeeRepository } from './employee/repository.js';
export type { CustomerRepository } from './customer/repository.js';
export type { SupplierRepository } from './supplier/repository.js';
export type { ProductRepository } from './product/repository.js';
export type { ServiceRepository } from './service/repository.js';
export type { MachineRepository } from './machine/repository.js';
export type { ProjectRepository } from './project/repository.js';
export type { QuotationRepository } from './quotation/repository.js';
export type { OrderRepository } from './order/repository.js';
export type { InvoiceRepository } from './invoice/repository.js';
export type { WorkflowRepository } from './workflow/repository.js';
export type { PolicyRepository } from './policy/repository.js';
export type { KpiRepository } from './kpi/repository.js';
export type { AssetRepository } from './asset/repository.js';
export type { AgentRepository } from './agent/repository.js';
export type { RoleRepository } from './role/repository.js';
export type { PermissionRepository } from './permission/repository.js';
