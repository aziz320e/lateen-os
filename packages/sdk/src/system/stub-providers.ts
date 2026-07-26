/**
 * "Not configured" stand-ins for AI Provider Hub capability ports.
 * `createAiProviderHub` requires chat/embedding/vision/speech/image, but
 * only chat and embedding have real OpenAI-compatible adapters in this
 * monorepo today (vision/speech/image are bring-your-own — see
 * `@lateen-os/ai-provider-hub`'s hub.impl.ts). Rather than forcing every
 * `createLateen()` caller to supply all five up front, unconfigured
 * capabilities degrade to a stub that throws a clear, typed error only if
 * actually invoked — composition and testing work with zero live
 * providers, matching this monorepo's "usable offline" convention.
 *
 * @module system/stub-providers
 */
import type { EmbeddingProvider, ImageProvider, SpeechProvider, StreamingChatProvider, VisionProvider } from '@lateen-os/ai-provider-hub';

export class ProviderNotConfiguredError extends Error {
  constructor(readonly capability: string) {
    super(`AI provider capability "${capability}" was not configured for this Lateen system.`);
    this.name = 'ProviderNotConfiguredError';
  }
}

export function createUnconfiguredChatProvider(): StreamingChatProvider {
  return {
    async complete() {
      throw new ProviderNotConfiguredError('chat');
    },
    stream() {
      throw new ProviderNotConfiguredError('chat');
    },
  };
}

export function createUnconfiguredEmbeddingProvider(): EmbeddingProvider {
  return {
    async embed() {
      throw new ProviderNotConfiguredError('embedding');
    },
    async embedBatch() {
      throw new ProviderNotConfiguredError('embedding');
    },
    async getDimensions() {
      throw new ProviderNotConfiguredError('embedding');
    },
  };
}

export function createUnconfiguredVisionProvider(): VisionProvider {
  return {
    async analyze() {
      throw new ProviderNotConfiguredError('vision');
    },
    supportsMimeType() {
      return false;
    },
  };
}

export function createUnconfiguredSpeechProvider(): SpeechProvider {
  return {
    async transcribe() {
      throw new ProviderNotConfiguredError('speech');
    },
    async synthesize() {
      throw new ProviderNotConfiguredError('speech');
    },
  };
}

export function createUnconfiguredImageProvider(): ImageProvider {
  return {
    async generate() {
      throw new ProviderNotConfiguredError('image');
    },
  };
}
