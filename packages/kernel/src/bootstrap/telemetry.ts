/** @module bootstrap/telemetry */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import type { KernelConfig } from '../configuration/schema.js';

let sdk: NodeSDK | undefined;

export function initKernelTelemetry(config: KernelConfig): void {
  if (!config.telemetryEnabled || sdk) return;

  sdk = new NodeSDK({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: 'lateen-kernel',
      [ATTR_SERVICE_VERSION]: '0.0.0',
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${config.otlpEndpoint.replace(/\/$/, '')}/v1/traces`,
    }),
  });

  sdk.start();
}

export async function shutdownKernelTelemetry(): Promise<void> {
  if (!sdk) return;
  await sdk.shutdown();
  sdk = undefined;
}
