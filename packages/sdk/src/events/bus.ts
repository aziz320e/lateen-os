/** @module events/bus */
import { sdkEventDefinitionSchema, type SdkEvent, type SdkEventDefinition, type SdkEventHandler } from './types.js';

export class SdkEventBus {
  private readonly handlers = new Map<string, Set<SdkEventHandler>>();

  defineEvent(input: SdkEventDefinition): SdkEventDefinition {
    return sdkEventDefinitionSchema.parse(input);
  }

  publish<TPayload>(name: string, payload: TPayload, source?: string): SdkEvent<TPayload> {
    const event: SdkEvent<TPayload> = {
      name,
      payload,
      timestamp: new Date().toISOString(),
      source,
    };

    const listeners = this.handlers.get(name);
    if (listeners) {
      for (const handler of listeners) {
        void handler(event);
      }
    }

    return event;
  }

  subscribe<TPayload>(name: string, handler: SdkEventHandler<TPayload>): () => void {
    const set = this.handlers.get(name) ?? new Set();
    set.add(handler as SdkEventHandler);
    this.handlers.set(name, set);

    return () => {
      set.delete(handler as SdkEventHandler);
    };
  }
}

export const defineEvent = (input: SdkEventDefinition): SdkEventDefinition =>
  sdkEventDefinitionSchema.parse(input);

export function publish<TPayload>(
  bus: SdkEventBus,
  name: string,
  payload: TPayload,
  source?: string,
): SdkEvent<TPayload> {
  return bus.publish(name, payload, source);
}

export function subscribe<TPayload>(
  bus: SdkEventBus,
  name: string,
  handler: SdkEventHandler<TPayload>,
): () => void {
  return bus.subscribe(name, handler);
}
