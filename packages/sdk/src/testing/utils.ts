/** @module testing/utils */
import { SdkEventBus } from '../events/bus.js';
import { createLateenSDK } from '../core/sdk.js';

export function createTestSdk(workspaceRoot = process.cwd()) {
  return createLateenSDK({
    workspaceRoot,
    environment: 'test',
  });
}

export function createTestEventBus() {
  return new SdkEventBus();
}

export async function collectEvents<TPayload>(
  bus: SdkEventBus,
  eventName: string,
  action: () => void | Promise<void>,
): Promise<Array<{ name: string; payload: TPayload }>> {
  const collected: Array<{ name: string; payload: TPayload }> = [];
  const unsubscribe = bus.subscribe<TPayload>(eventName, (event) => {
    collected.push({ name: event.name, payload: event.payload });
  });
  await action();
  unsubscribe();
  return collected;
}
