/** @module events/types */
export type ExtensionEventName =
  | 'extension.installed'
  | 'extension.removed'
  | 'extension.loaded'
  | 'extension.failed'
  | 'permission.denied';

export interface ExtensionEvent<TPayload = unknown> {
  readonly name: ExtensionEventName;
  readonly extensionId: string;
  readonly payload: TPayload;
  readonly timestamp: string;
}

export type ExtensionInstalled = ExtensionEvent<{ version: string; path: string }>;
export type ExtensionRemoved = ExtensionEvent<{ version: string }>;
export type ExtensionLoaded = ExtensionEvent<{ type: string }>;
export type ExtensionFailed = ExtensionEvent<{ error: string; phase: string }>;
export type PermissionDenied = ExtensionEvent<{ permission: string }>;

export const EXTENSION_EVENT_NAMES = {
  ExtensionInstalled: 'extension.installed',
  ExtensionRemoved: 'extension.removed',
  ExtensionLoaded: 'extension.loaded',
  ExtensionFailed: 'extension.failed',
  PermissionDenied: 'permission.denied',
} as const;

export type ExtensionDomainEvent =
  | ExtensionInstalled
  | ExtensionRemoved
  | ExtensionLoaded
  | ExtensionFailed
  | PermissionDenied;
