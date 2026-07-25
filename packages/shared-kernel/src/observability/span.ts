/**
 * Shared OpenTelemetry span-wrapping helper. Generalizes the pattern already
 * used ad hoc in `packages/connector-base/src/telemetry.ts` (`withTelemetry`)
 * into a reusable, tracer-name-parameterized utility.
 *
 * @module observability/span
 */
import { trace, SpanStatusCode, type Attributes, type Span } from '@opentelemetry/api';

/** Runs `fn` inside an active span, recording success/error status and ending the span. */
export async function withSpan<T>(
  tracerName: string,
  spanName: string,
  fn: (span: Span) => Promise<T>,
  attributes: Attributes = {},
): Promise<T> {
  const tracer = trace.getTracer(tracerName);
  return tracer.startActiveSpan(spanName, async (span) => {
    for (const [key, value] of Object.entries(attributes)) {
      span.setAttribute(key, value as never);
    }
    try {
      const result = await fn(span);
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
