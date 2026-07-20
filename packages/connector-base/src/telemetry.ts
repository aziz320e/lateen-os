import { trace, SpanStatusCode } from '@opentelemetry/api';
import type { ConnectorConfiguration } from '@lateen-os/integration-contracts';

const tracer = trace.getTracer('lateen.connector');

export async function withTelemetry<T>(
  operation: string,
  definitionCode: string,
  fn: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(`connector.${definitionCode}.${operation}`, async (span) => {
    span.setAttribute('connector.definition_code', definitionCode);
    span.setAttribute('connector.operation', operation);
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function mapProviderError(error: unknown, definitionCode: string): { code: string; message: string } {
  if (error instanceof RateLimitError) {
    return { code: 'RATE_LIMIT', message: `Rate limit exceeded for ${definitionCode}` };
  }
  if (error instanceof AuthenticationError) {
    return { code: 'AUTH_FAILED', message: `Authentication failed for ${definitionCode}` };
  }
  if (error instanceof Error) {
    return { code: 'PROVIDER_ERROR', message: error.message };
  }
  return { code: 'UNKNOWN', message: String(error) };
}

export class RateLimitError extends Error {
  constructor(
    readonly retryAfterMs: number,
    message = 'Rate limit exceeded',
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 250;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (error instanceof RateLimitError && attempt < maxAttempts) {
        await sleep(error.retryAfterMs || baseDelayMs * attempt);
        continue;
      }
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * attempt);
        continue;
      }
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function validateAuthConfig(
  config: ConnectorConfiguration,
  requiredKeys: string[],
): void {
  for (const key of requiredKeys) {
    if (!config.settings[key]) {
      throw new AuthenticationError(`Missing required setting: ${key}`);
    }
  }
}
