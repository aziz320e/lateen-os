/** @module events/bus */
import { EventEmitter } from 'node:events';
import type { ExtensionDomainEvent, ExtensionEvent, ExtensionEventName } from './types.js';

export class ExtensionEventBus {
  private readonly emitter = new EventEmitter();

  publish<TPayload>(name: ExtensionEventName, extensionId: string, payload: TPayload): ExtensionEvent<TPayload> {
    const event: ExtensionEvent<TPayload> = {
      name,
      extensionId,
      payload,
      timestamp: new Date().toISOString(),
    };
    this.emitter.emit(name, event);
    return event;
  }

  subscribe(name: ExtensionEventName, handler: (event: ExtensionDomainEvent) => void): () => void {
    this.emitter.on(name, handler);
    return () => this.emitter.off(name, handler);
  }
}

export function createExtensionEventBus(): ExtensionEventBus {
  return new ExtensionEventBus();
}
