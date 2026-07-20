/** @module events/bus */
import { EventEmitter } from 'node:events';

export type KernelEventName =
  | 'kernel.bootstrapping'
  | 'kernel.bootstrapped'
  | 'kernel.starting'
  | 'kernel.started'
  | 'kernel.stopping'
  | 'kernel.stopped'
  | 'kernel.health.checked'
  | 'kernel.diagnostics.completed'
  | 'kernel.recovery.started'
  | 'kernel.recovery.completed'
  | 'kernel.plugin.loaded'
  | 'kernel.shutdown';

export interface KernelEventPayload {
  readonly timestamp: string;
  readonly detail?: Record<string, unknown>;
}

export class KernelEventBus {
  private readonly emitter = new EventEmitter();

  emit(event: KernelEventName, detail?: Record<string, unknown>): void {
    const payload: KernelEventPayload = {
      timestamp: new Date().toISOString(),
      detail,
    };
    this.emitter.emit(event, payload);
  }

  on(event: KernelEventName, listener: (payload: KernelEventPayload) => void): void {
    this.emitter.on(event, listener);
  }

  off(event: KernelEventName, listener: (payload: KernelEventPayload) => void): void {
    this.emitter.off(event, listener);
  }
}

export function createKernelEventBus(): KernelEventBus {
  return new KernelEventBus();
}
