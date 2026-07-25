/**
 * Shared in-memory typed event bus. Generalizes the small ad hoc pub/sub
 * implementations already duplicated in `packages/sdk`, `packages/kernel`,
 * and `packages/extension-system` into one generic, reusable implementation.
 *
 * @module events/event-bus
 */

export interface EventMeta {
  readonly name: string;
  readonly timestamp: string;
  readonly source?: string;
}

export type EventHandler<TPayload> = (payload: TPayload, meta: EventMeta) => void | Promise<void>;
export type WildcardEventHandler<TEventMap extends Record<string, unknown>> = (
  name: keyof TEventMap & string,
  payload: TEventMap[keyof TEventMap],
  meta: EventMeta,
) => void | Promise<void>;

/** Typed publish/subscribe event bus, keyed by an event-name-to-payload map. */
export interface EventBus<TEventMap extends Record<string, unknown>> {
  publish<TName extends keyof TEventMap & string>(
    name: TName,
    payload: TEventMap[TName],
    source?: string,
  ): void;
  subscribe<TName extends keyof TEventMap & string>(
    name: TName,
    handler: EventHandler<TEventMap[TName]>,
  ): () => void;
  /** Subscribe to every event published on this bus, regardless of name. */
  subscribeAll(handler: WildcardEventHandler<TEventMap>): () => void;
}

/** Creates an in-memory {@link EventBus}. Handlers are invoked fire-and-forget (errors are not swallowed silently — they surface as unhandled rejections, matching the existing sdk/kernel bus behavior). */
export function createEventBus<TEventMap extends Record<string, unknown>>(): EventBus<TEventMap> {
  const handlers = new Map<string, Set<EventHandler<unknown>>>();
  const wildcardHandlers = new Set<WildcardEventHandler<TEventMap>>();

  return {
    publish(name, payload, source) {
      const meta: EventMeta = { name, timestamp: new Date().toISOString(), source };

      const set = handlers.get(name);
      if (set) {
        for (const handler of set) void handler(payload, meta);
      }
      for (const handler of wildcardHandlers) void handler(name, payload as TEventMap[keyof TEventMap], meta);
    },
    subscribe(name, handler) {
      const set = handlers.get(name) ?? new Set<EventHandler<unknown>>();
      set.add(handler as EventHandler<unknown>);
      handlers.set(name, set);
      return () => {
        set.delete(handler as EventHandler<unknown>);
      };
    },
    subscribeAll(handler) {
      wildcardHandlers.add(handler);
      return () => {
        wildcardHandlers.delete(handler);
      };
    },
  };
}
