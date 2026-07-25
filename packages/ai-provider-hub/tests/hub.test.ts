import { describe, expect, it } from 'vitest';
import { createAiProviderHub } from '../src/hub.impl.js';
import type { StreamingChatProvider } from '../src/streaming/types.js';
import type { EmbeddingProvider } from '../src/embedding/provider.js';
import type { VisionProvider } from '../src/vision/provider.js';
import type { SpeechProvider } from '../src/speech/provider.js';
import type { ImageProvider } from '../src/image/provider.js';

// Minimal fakes for the caller-supplied (bring-your-own / not-yet-implemented) capabilities.
const fakeChat: StreamingChatProvider = {
  complete: async () => {
    throw new Error('not used in this test');
  },
  stream: async function* () {
    // no-op generator
  },
};
const fakeEmbedding: EmbeddingProvider = {
  embed: async () => {
    throw new Error('not used');
  },
  embedBatch: async () => [],
  getDimensions: async () => 0,
};
const fakeVision: VisionProvider = {
  analyze: async () => {
    throw new Error('not used');
  },
  supportsMimeType: () => false,
};
const fakeSpeech: SpeechProvider = {
  transcribe: async () => {
    throw new Error('not used');
  },
  synthesize: async () => {
    throw new Error('not used');
  },
};
const fakeImage: ImageProvider = {
  generate: async () => {
    throw new Error('not used');
  },
};

function buildHub() {
  return createAiProviderHub({
    chat: fakeChat,
    embedding: fakeEmbedding,
    vision: fakeVision,
    speech: fakeSpeech,
    image: fakeImage,
  });
}

describe('createAiProviderHub', () => {
  it('wires every capability, including the caller-supplied providers', () => {
    const hub = buildHub();
    expect(hub.capabilities.registry).toBeDefined();
    expect(hub.capabilities.modelRegistry).toBeDefined();
    expect(hub.capabilities.selector).toBeDefined();
    expect(hub.capabilities.health).toBeDefined();
    expect(hub.capabilities.costCalculator).toBeDefined();
    expect(hub.capabilities.cache).toBeDefined();
    expect(hub.capabilities.telemetry).toBeDefined();
    expect(hub.capabilities.policy).toBeDefined();
    expect(hub.capabilities.queries).toBeDefined();
    expect(hub.capabilities.chat).toBe(fakeChat);
    expect(hub.capabilities.embedding).toBe(fakeEmbedding);
    expect(hub.capabilities.vision).toBe(fakeVision);
    expect(hub.capabilities.speech).toBe(fakeSpeech);
    expect(hub.capabilities.image).toBe(fakeImage);
  });

  it('defaults the version and lets it be overridden', () => {
    expect(buildHub().version).toBe('1.0.0');
    expect(
      createAiProviderHub({
        chat: fakeChat,
        embedding: fakeEmbedding,
        vision: fakeVision,
        speech: fakeSpeech,
        image: fakeImage,
        version: '2.0.0',
      }).version,
    ).toBe('2.0.0');
  });

  it('the registry inside the hub is pre-populated with the provider catalog', () => {
    const hub = buildHub();
    expect(hub.capabilities.registry.list().length).toBeGreaterThan(0);
  });

  it('the queries layer answers listProviders using the wired registry', async () => {
    const hub = buildHub();
    const result = await hub.capabilities.queries.listProviders({});
    expect(result.providers.length).toBeGreaterThan(0);
  });

  it('an injected health check function flows through to the wired health capability', async () => {
    const hub = createAiProviderHub({
      chat: fakeChat,
      embedding: fakeEmbedding,
      vision: fakeVision,
      speech: fakeSpeech,
      image: fakeImage,
      healthCheck: async () => ({ status: 'degraded' }),
    });
    const snapshot = await hub.capabilities.health.check('openai');
    expect(snapshot.status).toBe('degraded');
  });
});
