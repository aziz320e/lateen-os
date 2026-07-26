/**
 * @lateen-os/sdk — Lateen SDK
 *
 * Official developer interface for extending Lateen OS.
 * Wraps platform contracts into a strongly typed developer experience.
 *
 * No business logic. No LLM SDK. No persistence.
 *
 * @packageDocumentation
 */

export * from './core/index.js';

export * as system from './system/index.js';

export * as application from './application/index.js';
export * as service from './service/index.js';
export * as plugin from './plugin/index.js';
export * as worker from './worker/index.js';
export * as workflow from './workflow/index.js';
export * as mission from './mission/index.js';
export * as connector from './connector/index.js';
export * as commands from './commands/index.js';
export * as events from './events/index.js';
export * as configuration from './configuration/index.js';
export * as validation from './validation/index.js';
export * as templates from './templates/index.js';

// Lateen OS runtime entry point — the official public composition root.
// Wires shared-kernel, ai-provider-hub, decision-engine, intelligence-engine,
// ai-runtime, ai-brain, and ceo-engine together. See system/index.ts.
export {
  createLateen,
  type LateenConfig,
  type LateenSystem,
  type LateenClient,
  type CEO,
  type Brain,
  type Runtime,
  type DecisionEngine,
  type IntelligenceEngine,
  type ProviderHub,
} from './system/index.js';

// Core (LateenSDK — the extension-authoring toolkit: plugins, workers,
// workflows, connectors, missions, commands. A separate concern from the
// runtime composition root above.)
export { LateenSDK, createLateenSDK } from './core/sdk.js';
export type { SDKContext, SDKConfiguration, SdkEnvironment } from './core/types.js';
export { SDK_VERSION, formatSdkVersion } from './core/version.js';
export type { SDKVersion } from './core/version.js';

// Applications
export {
  defineApplication,
  createApplication,
  createApplicationFactory,
} from './application/factory.js';
export type {
  ApplicationDefinition,
  ApplicationRoute,
  ApplicationPage,
  ApplicationWidget,
} from './application/types.js';

// Services
export { defineService, createService, createServiceFactory } from './service/factory.js';
export type { ServiceDefinition, ServiceApiRoute, ServiceHealth, ServiceEvent } from './service/types.js';

// Plugins
export { definePlugin, createPluginFactory } from './plugin/factory.js';
export type {
  PluginManifest,
  PluginPermission,
  PluginCapability,
  PluginLifecycle,
  PluginLifecycleHooks,
} from './plugin/types.js';

// Workers
export { defineWorker, createWorkerFactory } from './worker/factory.js';
export type { WorkerProfile, WorkerSkill, WorkerEvent, WorkerLifecycle } from './worker/types.js';

// Workflows
export { defineWorkflow, createWorkflowFactory } from './workflow/factory.js';
export type { WorkflowDefinition, WorkflowStep, WorkflowTrigger } from './workflow/types.js';

// Missions
export { defineMission, createMissionFactory } from './mission/factory.js';
export type { MissionDefinition, MissionStage, MissionOutput } from './mission/types.js';

// Connectors
export { defineConnector, createConnectorFactory } from './connector/factory.js';
export type { ConnectorManifest, ConnectorAuth, ConnectorSync, ConnectorWebhook } from './connector/types.js';

// Commands
export { defineCommand, createCommandFactory } from './commands/factory.js';
export type { CommandDefinition, SlashCommand, CLICommand, AssistantCommand } from './commands/types.js';

// Events
export { SdkEventBus, defineEvent, publish, subscribe } from './events/bus.js';
export type { SdkEvent, SdkEventDefinition, SdkEventHandler } from './events/types.js';

// Configuration
export { defineConfig, createConfigFactory } from './configuration/factory.js';
export { environmentSchema, featureFlagsSchema } from './configuration/types.js';
export type { SdkConfigDefinition, FeatureFlags, SdkEnvironmentName } from './configuration/types.js';

// Validation
export { validateManifest, validatePermissions, validateSchema, safeValidateSchema } from './validation/index.js';

// Testing (re-exported at root for convenience; also available at @lateen-os/sdk/testing)
export {
  createMockService,
  createMockWorker,
  createMockWorkflow,
  createMockConnector,
  createTestSdk,
  createTestEventBus,
  collectEvents,
} from './testing/index.js';
