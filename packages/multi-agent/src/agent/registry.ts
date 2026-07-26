/**
 * Agent Registry port — tracks which AI Workforce workers are registered
 * and available for multi-agent collaboration.
 *
 * @module agent/registry
 */
import type { OrganizationId } from '../shared/identifiers.js';
import type { AgentAvailability, AgentDescriptor, AgentRegistration, WorkerId } from './types.js';

export interface AgentRegistry {
  register(organizationId: OrganizationId, descriptor: AgentDescriptor): Promise<AgentRegistration>;
  deactivate(organizationId: OrganizationId, workerId: WorkerId): Promise<void>;
  setAvailability(organizationId: OrganizationId, workerId: WorkerId, availability: AgentAvailability): Promise<AgentRegistration>;
  findByWorkerId(organizationId: OrganizationId, workerId: WorkerId): Promise<AgentRegistration | null>;
  list(organizationId: OrganizationId): Promise<readonly AgentRegistration[]>;
}
