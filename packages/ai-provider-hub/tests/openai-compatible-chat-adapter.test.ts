import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createOpenAiCompatibleChatProvider } from '../src/streaming/openai-compatible-adapter.js';
import type { ChatCompletionRequest } from '../src/streaming/types.js';

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

function baseRequest(overrides: Partial<ChatCompletionRequest> = {}): ChatCompletionRequest {
  return {
    modelId: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello' }],
    stream: false,
    ...overrides,
  };
}

describe('createOpenAiCompatibleChatProvider — complete()', () => {
  it('maps a real OpenAI-shaped JSON response into ChatCompletionResult', async () => {
    const baseUrl = await startServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const parsed = JSON.parse(body);
        expect(parsed.model).toBe('gpt-4o-mini');
        expect(parsed.messages).toEqual([{ role: 'user', content: 'Hello' }]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            choices: [{ message: { content: 'Hi there!' }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 5, completion_tokens: 3 },
          }),
        );
      });
    });

    const provider = createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl });
    const result = await provider.complete(baseRequest());

    expect(result.content).toBe('Hi there!');
    expect(result.promptTokens).toBe(5);
    expect(result.completionTokens).toBe(3);
    expect(result.finishReason).toBe('stop');
    expect(result.providerId).toBe('openai');
  });

  it('sends the API key as a Bearer Authorization header when configured', async () => {
    let receivedAuth: string | undefined;
    const baseUrl = await startServer((req, res) => {
      receivedAuth = req.headers.authorization;
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }));
      });
    });

    const provider = createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl, apiKey: 'sk-test-key' });
    await provider.complete(baseRequest());

    expect(receivedAuth).toBe('Bearer sk-test-key');
  });

  it('retries on a 500 response and eventually succeeds', async () => {
    let callCount = 0;
    const baseUrl = await startServer((req, res) => {
      callCount += 1;
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        if (callCount < 3) {
          res.writeHead(500);
          res.end('server error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ choices: [{ message: { content: 'recovered' } }] }));
      });
    });

    const provider = createOpenAiCompatibleChatProvider({
      providerId: 'openai',
      baseUrl,
      maxRetries: 3,
    });
    const result = await provider.complete(baseRequest());

    expect(result.content).toBe('recovered');
    expect(callCount).toBe(3);
  });

  it('does not retry a 400 response and throws immediately', async () => {
    let callCount = 0;
    const baseUrl = await startServer((req, res) => {
      callCount += 1;
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'bad request' }));
      });
    });

    const provider = createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl, maxRetries: 3 });
    await expect(provider.complete(baseRequest())).rejects.toThrow(/HTTP 400/);
    expect(callCount).toBe(1);
  });
});

describe('createOpenAiCompatibleChatProvider — stream()', () => {
  it('parses a real Server-Sent-Events stream into token + done events', async () => {
    const baseUrl = await startServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' });
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Hel' } }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'lo' } }] })}\n\n`);
        res.write(`data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: 'stop' }] })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      });
    });

    const provider = createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl });
    const events = [];
    for await (const event of provider.stream(baseRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events.filter((e) => e.type === 'token').map((e) => e.delta)).toEqual(['Hel', 'lo']);
    expect(events.some((e) => e.type === 'done' && e.finishReason === 'stop')).toBe(true);
  });

  it('yields an error event when the server responds with a non-OK status', async () => {
    const baseUrl = await startServer((req, res) => {
      req.on('data', () => {});
      req.on('end', () => {
        res.writeHead(500);
        res.end('boom');
      });
    });

    const provider = createOpenAiCompatibleChatProvider({ providerId: 'openai', baseUrl });
    const events = [];
    for await (const event of provider.stream(baseRequest({ stream: true }))) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0]!.type).toBe('error');
  });
});
