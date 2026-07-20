/** @module core/sdk */
import type { SDKConfiguration, SDKContext } from './types.js';
import { SDK_VERSION, formatSdkVersion } from './version.js';
import { createApplicationFactory, type ApplicationFactory } from '../application/factory.js';
import { createServiceFactory, type ServiceFactory } from '../service/factory.js';
import { createPluginFactory, type PluginFactory } from '../plugin/factory.js';
import { createWorkerFactory, type WorkerFactory } from '../worker/factory.js';
import { createWorkflowFactory, type WorkflowFactory } from '../workflow/factory.js';
import { createMissionFactory, type MissionFactory } from '../mission/factory.js';
import { createConnectorFactory, type ConnectorFactory } from '../connector/factory.js';
import { createCommandFactory, type CommandFactory } from '../commands/factory.js';
import { SdkEventBus } from '../events/bus.js';
import { createConfigFactory, type ConfigFactory } from '../configuration/factory.js';

export interface LateenSDKOptions extends SDKConfiguration {}

export class LateenSDK {
  readonly context: SDKContext;
  readonly applications: ApplicationFactory;
  readonly services: ServiceFactory;
  readonly plugins: PluginFactory;
  readonly workers: WorkerFactory;
  readonly workflows: WorkflowFactory;
  readonly missions: MissionFactory;
  readonly connectors: ConnectorFactory;
  readonly commands: CommandFactory;
  readonly config: ConfigFactory;
  readonly events: SdkEventBus;

  constructor(options: LateenSDKOptions) {
    this.context = {
      config: options,
      version: SDK_VERSION,
      createdAt: new Date().toISOString(),
    };

    this.applications = createApplicationFactory(this.context);
    this.services = createServiceFactory(this.context);
    this.plugins = createPluginFactory(this.context);
    this.workers = createWorkerFactory(this.context);
    this.workflows = createWorkflowFactory(this.context);
    this.missions = createMissionFactory(this.context);
    this.connectors = createConnectorFactory(this.context);
    this.commands = createCommandFactory(this.context);
    this.config = createConfigFactory(this.context);
    this.events = new SdkEventBus();
  }

  get versionString(): string {
    return formatSdkVersion(this.context.version);
  }
}

export function createLateenSDK(options: LateenSDKOptions): LateenSDK {
  return new LateenSDK(options);
}
