/** @module registry/types */

export type ServiceKind = 'backend' | 'frontend' | 'infrastructure';

export type PluginKind =
  | 'application'
  | 'service'
  | 'package'
  | 'ai-worker'
  | 'connector'
  | 'workflow'
  | 'mission';

export interface PlatformServiceDefinition {
  readonly name: string;
  readonly displayName: string;
  readonly package: string;
  readonly path: string;
  readonly port: number;
  readonly kind: ServiceKind;
  readonly healthPath?: string;
  readonly dependencies: readonly string[];
  readonly infrastructureDependencies?: readonly string[];
}

export interface PluginDefinition {
  readonly id: string;
  readonly name: string;
  readonly kind: PluginKind;
  readonly version: string;
  readonly path: string;
  readonly enabled: boolean;
  readonly dependencies: readonly string[];
}

export interface ApplicationDefinition {
  readonly name: string;
  readonly displayName: string;
  readonly package: string;
  readonly path: string;
  readonly port: number;
}

export interface PlatformManifest {
  readonly version: string;
  readonly services: readonly PlatformServiceDefinition[];
  readonly applications: readonly ApplicationDefinition[];
  readonly infrastructure: readonly PlatformServiceDefinition[];
}
