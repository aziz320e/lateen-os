import { connect, type NatsConnection, StringCodec, type Subscription } from 'nats';
import type { CacheStore } from '../cache/redis-cache.js';

const sc = StringCodec();

export interface NatsIntegration {
  readonly connection: NatsConnection;
  readonly subscriptions: Subscription[];
  close(): Promise<void>;
}

export async function startNatsIntegration(
  natsUrl: string,
  cache: CacheStore,
  businessDnaSubjectPrefix = 'lateen.business-dna',
): Promise<NatsIntegration> {
  const connection = await connect({ servers: natsUrl });
  const subscriptions: Subscription[] = [];

  const invalidateCatalog = async (organizationId?: string) => {
    if (organizationId) {
      await cache.deleteByPrefix(`catalog:${organizationId}`);
      await cache.deleteByPrefix(`capabilities:${organizationId}`);
      await cache.deleteByPrefix(`business-dna:${organizationId}`);
      return;
    }
    await cache.deleteByPrefix('catalog:');
    await cache.deleteByPrefix('capabilities:');
  };

  const entityEvents = ['product', 'machine', 'customer', 'branch', 'department', 'agent'];
  for (const entity of entityEvents) {
    const sub = connection.subscribe(`${businessDnaSubjectPrefix}.${entity}_created`);
    subscriptions.push(sub);
    void (async () => {
      for await (const message of sub) {
        try {
          const event = JSON.parse(sc.decode(message.data)) as {
            payload?: { organizationId?: string };
          };
          await invalidateCatalog(event.payload?.organizationId);
        } catch {
          await invalidateCatalog();
        }
      }
    })();

    const updateSub = connection.subscribe(`${businessDnaSubjectPrefix}.${entity}_updated`);
    subscriptions.push(updateSub);
    void (async () => {
      for await (const message of updateSub) {
        try {
          const event = JSON.parse(sc.decode(message.data)) as {
            payload?: { organizationId?: string };
          };
          await invalidateCatalog(event.payload?.organizationId);
        } catch {
          await invalidateCatalog();
        }
      }
    })();
  }

  return {
    connection,
    subscriptions,
    async close() {
      for (const sub of subscriptions) {
        sub.unsubscribe();
      }
      await connection.drain();
    },
  };
}
