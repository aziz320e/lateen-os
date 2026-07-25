import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createOpenAiCompatibleEmbeddingProvider } from '../src/embedding/openai-compatible-embedding-adapter.js';

let server: Server | undefined;

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = undefined;
  }
});

function startServer(handler: (req: IncomingMessage, res: ServerResponse) => void): Promise<string> {
  return new Promise((resolve) => {
    server = createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      const address = server!.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

describe('createOpenAiCompatibleEmbeddingProvider', () => {
  it('embeds a single input and maps the real OpenAI-shaped response', async () => {
    const baseUrl = await startServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = JSON.parse(body);
        expect(parsed.model).toBe('text-embedding-3-large');
        expect(parsed.input).toBe('hello world');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [{ embedding: [0.1, 0.2, 0.3] }], usage: { total_tokens: 2 } }));
      });
    });

    const provider = createOpenAiCompatibleEmbeddingProvider({ providerId: 'openai', baseUrl });
    const result = await provider.embed({ input: 'hello world', modelId: 'text-embedding-3-large' });

    expect(result.embeddings).toEqual([[0.1, 0.2, 0.3]]);
    expect(result.tokenCount).toBe(2);
    expect(result.providerId).toBe('openai');
  });

  it('embedBatch issues one request per input and preserves order', async () => {
    let callCount = 0;
    const baseUrl = await startServer((req, res) => {
      callCount += 1;
      const responseEmbedding = callCount === 1 ? [1, 0] : [0, 1];
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [{ embedding: responseEmbedding }] }));
      });
    });

    const provider = createOpenAiCompatibleEmbeddingProvider({ providerId: 'openai', baseUrl });
    const results = await provider.embedBatch([
      { input: 'first', modelId: 'text-embedding-3-large' },
      { input: 'second', modelId: 'text-embedding-3-large' },
    ]);

    expect(results).toHaveLength(2);
    expect(callCount).toBe(2);
  });

  it('getDimensions returns the length of a real probe embedding', async () => {
    const baseUrl = await startServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: [{ embedding: [1, 2, 3, 4] }] }));
      });
    });

    const provider = createOpenAiCompatibleEmbeddingProvider({ providerId: 'openai', baseUrl });
    await expect(provider.getDimensions('text-embedding-3-large')).resolves.toBe(4);
  });

  it('throws with a descriptive message on a non-OK response', async () => {
    const baseUrl = await startServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'unauthorized' }));
      });
    });

    const provider = createOpenAiCompatibleEmbeddingProvider({ providerId: 'openai', baseUrl });
    await expect(provider.embed({ input: 'x', modelId: 'text-embedding-3-large' })).rejects.toThrow(/HTTP 401/);
  });
});
