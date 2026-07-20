import type { DomainGraphPort } from '../../ports/outbound/domain-graph-port.js';

export function createNoOpDomainGraphClient(): DomainGraphPort {
  return {
    findNeighbors: async (nodeId) => ({ nodeId, neighbors: [] }),
    findAncestors: async (nodeId) => ({ nodeId, ancestors: [] }),
    findDescendants: async (nodeId) => ({ nodeId, descendants: [] }),
    findShortestPath: async () => null,
    findRelatedEntities: async (nodeId) => ({ sourceNodeId: nodeId, relatedNodes: [], depth: 0 }),
    findImpactedEntities: async (nodeId) => ({ sourceNodeId: nodeId, impactedNodes: [] }),
    findCapabilitiesForMachine: async (_organizationId, machineId) => ({
      machineId,
      capabilities: [],
    }),
    findProductsForMachine: async (_organizationId, machineId) => ({ machineId, products: [] }),
    findProjectsForCustomer: async (_organizationId, customerId) => ({ customerId, projects: [] }),
    findMachinesForCapability: async (_organizationId, capabilityId) => ({
      capabilityId,
      machines: [],
    }),
    findCustomersUsingCapability: async (_organizationId, capabilityId) => ({
      capabilityId,
      customers: [],
    }),
    resolveProductContext: async () => ({ context: 'mock' }),
  } as DomainGraphPort;
}
