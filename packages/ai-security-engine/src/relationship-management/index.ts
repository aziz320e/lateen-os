/**
 * Relationship Layer — integrates AI Brain, Workflow Engine,
 * Communication Hub, and Business DNA, exclusively through their public
 * APIs. (AI Runtime and AI Provider Hub are integrated by Tool Security
 * and Provider Security respectively.)
 * @module relationship-management
 */
export * from './types.js';
export {
  createRelationshipManagement,
  type RelationshipManagement,
  type RaiseSecurityWorkflowInput,
  type RaisedSecurityWorkflow,
  type NotifySecurityEventInput,
} from './service.impl.js';
